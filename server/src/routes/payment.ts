import { Router, Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import { generateOrderNo } from '../services/payment.service.js';
import { wechatSign, verifyWechatSign } from '../services/payment.service.js';

const router = Router();

// 认证中间件（简化版，实际应从token中获取）
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
    const { type, productId, amount, paymentMethod } = req.body;

    if (!type || !amount || !paymentMethod) {
      return res.status(400).json({ error: '参数不完整' });
    }

    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return res.status(400).json({ error: '不支持的支付方式' });
    }

    const db = getDatabase();
    const orderNo = generateOrderNo();

    // 创建订单
    const result = db.prepare(
      'INSERT INTO orders (order_no, user_id, amount, payment_method, status, product_type, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(orderNo, req.userId, amount, paymentMethod, 'pending', type, productId || null);

    // 这里应该调用实际的支付API，返回支付链接或二维码
    // 简化处理，直接返回模拟数据

    res.json({
      orderId: result.lastInsertRowid,
      orderNo,
      amount,
      paymentMethod,
      status: 'pending',
      // 实际项目中这里返回支付链接或二维码
      payUrl: `https://pay.example.com/${orderNo}`,
      qrCode: `data:image/png;base64,MOCK_QRCODE` // 实际应生成真实二维码
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 微信支付回调
router.post('/wechat/notify', async (req: Request, res: Response) => {
  try {
    const { out_trade_no, transaction_id, total_fee, result_code, sign } = req.body;

    // 验证签名
    if (!verifyWechatSign(req.body, process.env.WECHAT_API_KEY || '')) {
      return res.status(400).json({ return_code: 'FAIL', return_msg: '签名错误' });
    }

    if (result_code === 'SUCCESS') {
      const db = getDatabase();

      // 查找订单
      const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(out_trade_no) as any;

      if (!order) {
        return res.status(404).json({ return_code: 'FAIL', return_msg: '订单不存在' });
      }

      if (order.status === 'paid') {
        return res.json({ return_code: 'SUCCESS', return_msg: 'OK' });
      }

      // 更新订单状态
      db.prepare(
        'UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('paid', order.id);

      // 如果是购买套餐，添加用户tokens和订阅
      if (order.product_type === 'plan') {
        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(order.product_id) as any;

        if (plan) {
          // 添加订阅
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + plan.duration);

          db.prepare(
            'INSERT INTO subscriptions (user_id, plan, status, expires_at) VALUES (?, ?, ?, ?)'
          ).run(order.user_id, plan.name, 'active', expiresAt.toISOString());

          // 添加tokens
          db.prepare(
            'INSERT OR REPLACE INTO user_tokens (user_id, tokens, expires_at) VALUES (?, ?, ?)'
          ).run(order.user_id, plan.tokens, expiresAt.toISOString());
        }
      } else if (order.product_type === 'tokens') {
        // 直接充值tokens
        const tokensToAdd = order.amount * 100; // 假设1元=100tokens
        db.prepare(
          'UPDATE user_tokens SET tokens = tokens + ? WHERE user_id = ?'
        ).run(tokensToAdd, order.user_id);
      }
    }

    res.json({ return_code: 'SUCCESS', return_msg: 'OK' });
  } catch (error: any) {
    console.error('Wechat notify error:', error);
    res.status(500).json({ return_code: 'FAIL', return_msg: '处理失败' });
  }
});

// 支付宝回调
router.post('/alipay/notify', async (req: Request, res: Response) => {
  try {
    const { out_trade_no, trade_no, total_amount, trade_status } = req.body;

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const db = getDatabase();

      const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(out_trade_no) as any;

      if (!order) {
        return res.send('fail');
      }

      if (order.status === 'paid') {
        return res.send('success');
      }

      db.prepare(
        'UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('paid', order.id);

      // 处理套餐或充值（逻辑同微信支付）
      if (order.product_type === 'plan') {
        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(order.product_id) as any;

        if (plan) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + plan.duration);

          db.prepare(
            'INSERT INTO subscriptions (user_id, plan, status, expires_at) VALUES (?, ?, ?, ?)'
          ).run(order.user_id, plan.name, 'active', expiresAt.toISOString());

          db.prepare(
            'INSERT OR REPLACE INTO user_tokens (user_id, tokens, expires_at) VALUES (?, ?, ?)'
          ).run(order.user_id, plan.tokens, expiresAt.toISOString());
        }
      } else if (order.product_type === 'tokens') {
        const tokensToAdd = order.amount * 100;
        db.prepare(
          'UPDATE user_tokens SET tokens = tokens + ? WHERE user_id = ?'
        ).run(tokensToAdd, order.user_id);
      }
    }

    res.send('success');
  } catch (error: any) {
    console.error('Alipay notify error:', error);
    res.send('fail');
  }
});

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

    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: '获取订单失败' });
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
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

export default router;
