import { Router, Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import { generateOrderNo } from '../services/payment.service.js';
import wechatPay from '../services/wechat-pay.service.js';
import alipay from '../services/alipay.service.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { emailQueue } from '../queue/index.js';

const router = Router();

// 认证中间件
const authMiddleware = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的token' });
  }
};

// 创建订单
router.post('/create', authMiddleware, async (req: any, res: Response) => {
  try {
    const { type, productId, amount, paymentMethod, description } = req.body;

    if (!type || !amount || !paymentMethod) {
      return res.status(400).json({ error: '参数不完整' });
    }

    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return res.status(400).json({ error: '不支持的支付方式' });
    }

    const db = getDatabase();
    const orderNo = generateOrderNo();
    const totalAmount = Math.round(amount * 100); // 转换为分

    // 创建订单
    const result = db.prepare(
      'INSERT INTO orders (order_no, user_id, amount, payment_method, status, product_type, product_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(orderNo, req.userId, amount, paymentMethod, 'pending', type, productId || null, description || '');

    logger.info('Order created', { orderNo, userId: req.userId, amount, paymentMethod });

    let payData: any = {
      orderId: result.lastInsertRowid,
      orderNo,
      amount,
      paymentMethod,
      status: 'pending',
    };

    // 调用支付API
    if (paymentMethod === 'wechat') {
      try {
        const wechatResult = await wechatPay.createWeChatNativePayOrder(
          orderNo,
          description || `订单:${orderNo}`,
          totalAmount
        );
        payData.code_url = wechatResult?.code_url;
        payData.prepay_id = wechatResult?.prepay_id;
      } catch (error: any) {
        logger.error('WeChat order creation failed', { error: error.message, orderNo });
        // 即使支付API失败，订单也已创建，返回订单信息让用户重试
      }
    } else if (paymentMethod === 'alipay') {
      try {
        const alipayResult = await alipay.createAlipayQRCodePayOrder(
          orderNo,
          description || `订单:${orderNo}`,
          amount
        );
        payData.qr_code_url = alipayResult?.qr_code_url;
      } catch (error: any) {
        logger.error('Alipay order creation failed', { error: error.message, orderNo });
      }
    }

    res.json(payData);
  } catch (error: any) {
    logger.error('Create order error', { error: error.message });
    res.status(500).json({ error: error.message || '创建订单失败' });
  }
});

// 创建微信支付订单
router.post('/wechat/create', authMiddleware, async (req: any, res: Response) => {
  try {
    const { type, productId, amount, description } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const db = getDatabase();
    const orderNo = generateOrderNo();
    const totalAmount = Math.round(amount * 100);

    const result = db.prepare(
      'INSERT INTO orders (order_no, user_id, amount, payment_method, status, product_type, product_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(orderNo, req.userId, amount, 'wechat', 'pending', type, productId || null, description || '');

    const wechatResult = await wechatPay.createWeChatNativePayOrder(
      orderNo,
      description || `订单:${orderNo}`,
      totalAmount
    );

    logger.info('WeChat order created', { orderNo, userId: req.userId });

    res.json({
      orderId: result.lastInsertRowid,
      orderNo,
      amount,
      paymentMethod: 'wechat',
      status: 'pending',
      code_url: wechatResult?.code_url,
      prepay_id: wechatResult?.prepay_id,
    });
  } catch (error: any) {
    logger.error('WeChat order creation error', { error: error.message });
    res.status(500).json({ error: error.message || '创建微信支付订单失败' });
  }
});

// 微信支付回调
router.post('/wechat/notify', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['wechatpay-signature'] as string;
    const timestamp = req.headers['wechatpay-timestamp'] as string;
    const nonce = req.headers['wechatpay-nonce'] as string;
    const body = JSON.stringify(req.body);

    // 验证签名
    const verified = wechatPay.verifyWeChatNotifySignature(body, signature, timestamp, nonce);
    if (!verified) {
      logger.warn('WeChat notify signature verification failed');
      return res.status(401).send('FAIL');
    }

    // 解密数据
    const { resource } = req.body;
    const decryptedData = wechatPay.decryptWeChatNotifyData(
      resource.associated_data,
      resource.nonce,
      resource.ciphertext
    );

    const { out_trade_no, trade_state, transaction_id, amount } = decryptedData;

    logger.info('WeChat notify received', {
      orderNo: out_trade_no,
      tradeState,
      transactionId,
    });

    if (trade_state === 'SUCCESS') {
      const db = getDatabase();
      const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(out_trade_no) as any;

      if (!order) {
        logger.warn('WeChat notify: order not found', { orderNo: out_trade_no });
        return res.status(404).send('FAIL');
      }

      if (order.status === 'paid') {
        return res.send('SUCCESS');
      }

      // 验证金额
      const paidAmount = Math.round(order.amount * 100);
      if (Math.abs(amount.total - paidAmount) > 1) {
        logger.error('WeChat notify: amount mismatch', {
          orderNo: out_trade_no,
          expected: paidAmount,
          received: amount.total,
        });
        return res.status(400).send('FAIL');
      }

      // 更新订单状态
      db.prepare(
        'UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP, transaction_id = ? WHERE id = ?'
      ).run('paid', transaction_id, order.id);

      logger.info('Order paid', { orderNo: out_trade_no, userId: order.user_id });

      // 处理套餐或充值
      await handlePaymentSuccess(db, order);

      // 发送支付成功邮件
      try {
        const user = db.prepare('SELECT email FROM users WHERE id = ?').get(order.user_id) as any;
        if (user?.email) {
          let productName = '';
          if (order.product_type === 'plan') {
            const plan = db.prepare('SELECT name FROM plans WHERE id = ?').get(order.product_id) as any;
            productName = plan?.name || '';
          }

          await emailQueue.add('send-email', {
            type: 'payment-success',
            email: user.email,
            orderNo: out_trade_no,
            amount: order.amount,
            productType: order.product_type,
            productName,
          });
        }
      } catch (emailError: any) {
        logger.error('Failed to queue payment success email', {
          orderNo: out_trade_no,
          userId: order.user_id,
          error: emailError.message,
        });
      }
    }

    res.send('SUCCESS');
  } catch (error: any) {
    logger.error('WeChat notify error', { error: error.message });
    res.status(500).send('FAIL');
  }
});

// 支付宝回调
router.post('/alipay/notify', async (req: Request, res: Response) => {
  try {
    const params = req.body;

    // 验证签名
    const verified = alipay.verifyAlipayNotify(params);
    if (!verified) {
      logger.warn('Alipay notify signature verification failed', { outTradeNo: params.out_trade_no });
      return res.send('FAIL');
    }

    const { out_trade_no, trade_no, total_amount, trade_status } = params;

    logger.info('Alipay notify received', {
      orderNo: out_trade_no,
      tradeStatus,
      tradeNo,
    });

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const db = getDatabase();
      const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(out_trade_no) as any;

      if (!order) {
        logger.warn('Alipay notify: order not found', { orderNo: out_trade_no });
        return res.send('FAIL');
      }

      if (order.status === 'paid') {
        return res.send('success');
      }

      // 验证金额
      if (Math.abs(parseFloat(total_amount) - order.amount) > 0.01) {
        logger.error('Alipay notify: amount mismatch', {
          orderNo: out_trade_no,
          expected: order.amount,
          received: total_amount,
        });
        return res.send('FAIL');
      }

      // 更新订单状态
      db.prepare(
        'UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP, transaction_id = ? WHERE id = ?'
      ).run('paid', trade_no, order.id);

      logger.info('Order paid', { orderNo: out_trade_no, userId: order.user_id });

      // 处理套餐或充值
      await handlePaymentSuccess(db, order);

      // 发送支付成功邮件
      try {
        const user = db.prepare('SELECT email FROM users WHERE id = ?').get(order.user_id) as any;
        if (user?.email) {
          let productName = '';
          if (order.product_type === 'plan') {
            const plan = db.prepare('SELECT name FROM plans WHERE id = ?').get(order.product_id) as any;
            productName = plan?.name || '';
          }

          await emailQueue.add('send-email', {
            type: 'payment-success',
            email: user.email,
            orderNo: out_trade_no,
            amount: order.amount,
            productType: order.product_type,
            productName,
          });
        }
      } catch (emailError: any) {
        logger.error('Failed to queue payment success email', {
          orderNo: out_trade_no,
          userId: order.user_id,
          error: emailError.message,
        });
      }
    }

    res.send('success');
  } catch (error: any) {
    logger.error('Alipay notify error', { error: error.message });
    res.send('FAIL');
  }
});

// 处理支付成功
async function handlePaymentSuccess(db: any, order: any) {
  try {
    if (order.product_type === 'plan') {
      const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(order.product_id) as any;

      if (plan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration);

        // 添加或更新订阅
        const existingSubscription = db.prepare(
          'SELECT * FROM subscriptions WHERE user_id = ? AND status = ?'
        ).get(order.user_id, 'active') as any;

        if (existingSubscription) {
          db.prepare(
            'UPDATE subscriptions SET plan = ?, status = ?, expires_at = ? WHERE id = ?'
          ).run(plan.name, 'active', expiresAt.toISOString(), existingSubscription.id);
        } else {
          db.prepare(
            'INSERT INTO subscriptions (user_id, plan, status, expires_at) VALUES (?, ?, ?, ?)'
          ).run(order.user_id, plan.name, 'active', expiresAt.toISOString());
        }

        // 添加tokens
        db.prepare(
          'INSERT OR REPLACE INTO user_tokens (user_id, tokens, expires_at) VALUES (?, ?, ?)'
        ).run(order.user_id, plan.tokens, expiresAt.toISOString());

        logger.info('Plan subscription activated', {
          userId: order.user_id,
          plan: plan.name,
          tokens: plan.tokens,
          expiresAt: expiresAt.toISOString(),
        });
      }
    } else if (order.product_type === 'tokens') {
      const tokensToAdd = Math.round(order.amount * 100); // 1元=100tokens
      db.prepare(
        'INSERT OR REPLACE INTO user_tokens (user_id, tokens) VALUES (?, COALESCE((SELECT tokens FROM user_tokens WHERE user_id = ?), 0) + ?)'
      ).run(order.user_id, order.user_id, tokensToAdd);

      logger.info('Tokens added', { userId: order.user_id, tokensAdded: tokensToAdd });
    }
  } catch (error: any) {
    logger.error('Handle payment success error', { error: error.message, orderId: order.id });
  }
}

// 查询订单
router.get('/order/:orderNo', authMiddleware, async (req: any, res: Response) => {
  try {
    const db = getDatabase();
    const order = db.prepare(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?'
    ).get(req.params.orderNo, req.userId);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 如果订单未支付，尝试查询支付状态
    if (order.status === 'pending') {
      try {
        if (order.payment_method === 'wechat') {
          const wechatOrder = await wechatPay.queryWeChatOrder(order.order_no);
          if (wechatOrder.trade_state === 'SUCCESS') {
            await handlePaymentSuccess(db, order);
            order.status = 'paid';
            order.transaction_id = wechatOrder.transaction_id;
          }
        } else if (order.payment_method === 'alipay') {
          const alipayOrder = await alipay.queryAlipayOrder(order.order_no);
          if (alipayOrder.tradeStatus === 'TRADE_SUCCESS' || alipayOrder.tradeStatus === 'TRADE_FINISHED') {
            await handlePaymentSuccess(db, order);
            order.status = 'paid';
            order.transaction_id = alipayOrder.tradeNo;
          }
        }
      } catch (error: any) {
        logger.error('Query payment status error', { error: error.message, orderNo: order.order_no });
      }
    }

    res.json({ order });
  } catch (error: any) {
    logger.error('Get order error', { error: error.message });
    res.status(500).json({ error: error.message || '获取订单失败' });
  }
});

// 获取用户订单列表
router.get('/orders', authMiddleware, async (req: any, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const db = getDatabase();
    const orders = db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.userId, limit, offset);

    res.json({ orders });
  } catch (error: any) {
    logger.error('Get orders error', { error: error.message });
    res.status(500).json({ error: error.message || '获取订单列表失败' });
  }
});

// 申请退款
router.post('/refund', authMiddleware, async (req: any, res: Response) => {
  try {
    const { orderNo, reason } = req.body;

    if (!orderNo) {
      return res.status(400).json({ error: '订单号不能为空' });
    }

    const db = getDatabase();
    const order = db.prepare(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?'
    ).get(orderNo, req.userId) as any;

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ error: '订单未支付，无法退款' });
    }

    if (order.status === 'refunded') {
      return res.status(400).json({ error: '订单已退款' });
    }

    const refundOrderNo = `REFUND${generateOrderNo()}`;
    const totalAmount = Math.round(order.amount * 100);

    let refundResult: any;

    if (order.payment_method === 'wechat') {
      refundResult = await wechatPay.refundWeChatOrder(
        order.order_no,
        refundOrderNo,
        totalAmount,
        totalAmount
      );
    } else if (order.payment_method === 'alipay') {
      refundResult = await alipay.refundAlipayOrder(
        order.order_no,
        refundOrderNo,
        order.amount,
        reason || '用户申请退款'
      );
    } else {
      return res.status(400).json({ error: '不支持的支付方式' });
    }

    // 更新订单状态
    db.prepare(
      'UPDATE orders SET status = ?, refunded_at = CURRENT_TIMESTAMP, refund_order_no = ? WHERE id = ?'
    ).run('refunded', refundOrderNo, order.id);

    logger.info('Order refunded', { orderNo: order.order_no, refundOrderNo, userId: req.userId });

    res.json({
      orderNo: order.order_no,
      refundOrderNo,
      status: 'refunded',
      refundId: refundResult?.refund_id || refundResult?.fund_change,
    });
  } catch (error: any) {
    logger.error('Refund order error', { error: error.message });
    res.status(500).json({ error: error.message || '申请退款失败' });
  }
});

export default router;
