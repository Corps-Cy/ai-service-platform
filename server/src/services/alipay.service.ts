import AlipaySdk from 'alipay-sdk';
import AlipayFormData from 'alipay-sdk/lib/form.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// 支付宝配置
const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APPID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  charset: 'utf-8',
  version: '1.0',
  signType: 'RSA2',
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://yourdomain.com/api/payment/alipay/notify',
};

// 初始化支付宝SDK
let alipaySdk: AlipaySdk | null = null;

function initAlipay() {
  try {
    if (!ALIPAY_CONFIG.appId || !ALIPAY_CONFIG.privateKey) {
      throw new Error('支付宝配置不完整');
    }

    alipaySdk = new AlipaySdk({
      appId: ALIPAY_CONFIG.appId,
      privateKey: ALIPAY_CONFIG.privateKey,
      alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
      gateway: ALIPAY_CONFIG.gateway,
      charset: ALIPAY_CONFIG.charset,
      version: ALIPAY_CONFIG.version,
      signType: ALIPAY_CONFIG.signType as 'RSA2',
    });

    logger.info('Alipay SDK initialized');
  } catch (error: any) {
    logger.error('Failed to initialize Alipay SDK', { error: error.message });
    alipaySdk = null;
  }
}

// 创建支付宝支付订单（网页支付 - 返回支付表单）
export async function createAlipayWebPayOrder(
  orderNo: string,
  subject: string,
  totalAmount: number,
  returnUrl: string
): Promise<{ form: string; url: string }> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('returnUrl', returnUrl);
    formData.addField('bizContent', {
      outTradeNo: orderNo,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: totalAmount.toFixed(2),
      subject: subject,
    });

    const result = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: formData }
    );

    logger.info('Alipay web order created', { orderNo });

    return {
      url: result || '',
      form: '',
    };
  } catch (error: any) {
    logger.error('Alipay web order creation failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '创建支付宝订单失败');
  }
}

// 创建支付宝支付订单（手机网页支付 - 返回支付链接）
export async function createAlipayWapPayOrder(
  orderNo: string,
  subject: string,
  totalAmount: number,
  returnUrl: string,
  quitUrl: string
): Promise<{ url: string }> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('returnUrl', returnUrl);
    formData.addField('quitUrl', quitUrl);
    formData.addField('bizContent', {
      outTradeNo: orderNo,
      productCode: 'QUICK_WAP_WAY',
      totalAmount: totalAmount.toFixed(2),
      subject: subject,
    });

    const result = await alipaySdk.exec(
      'alipay.trade.wap.pay',
      {},
      { formData: formData }
    );

    logger.info('Alipay WAP order created', { orderNo });

    return {
      url: result || '',
    };
  } catch (error: any) {
    logger.error('Alipay WAP order creation failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '创建支付宝订单失败');
  }
}

// 创建支付宝支付订单（扫码支付 - 返回二维码URL）
export async function createAlipayQRCodePayOrder(
  orderNo: string,
  subject: string,
  totalAmount: number
): Promise<{ qr_code_url: string }> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const formData = new AlipayFormData();
    formData.addField('bizContent', {
      outTradeNo: orderNo,
      totalAmount: totalAmount.toFixed(2),
      subject: subject,
    });

    const result = await alipaySdk.exec(
      'alipay.trade.precreate',
      {},
      { formData: formData }
    );

    const qrCodeUrl = result?.qrCode || '';

    logger.info('Alipay QR code order created', { orderNo, responseCode: result?.code });

    return {
      qr_code_url: qrCodeUrl,
    };
  } catch (error: any) {
    logger.error('Alipay QR code order creation failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '创建支付宝订单失败');
  }
}

// 验证支付宝回调签名
export function verifyAlipayNotify(params: any): boolean {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    return false;
  }

  try {
    const signVerified = alipaySdk.checkNotifySign(params);

    if (!signVerified) {
      logger.warn('Alipay notify signature verification failed', { outTradeNo: params.out_trade_no });
    }

    return signVerified;
  } catch (error: any) {
    logger.error('Alipay notify signature verification error', { error: error.message });
    return false;
  }
}

// 查询支付宝订单
export async function queryAlipayOrder(orderNo: string): Promise<any> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.query', {}, {
      bizContent: {
        outTradeNo: orderNo,
      },
    });

    logger.info('Alipay order queried', { orderNo, tradeStatus: result?.tradeStatus });

    return result;
  } catch (error: any) {
    logger.error('Alipay order query failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '查询支付宝订单失败');
  }
}

// 关闭支付宝订单
export async function closeAlipayOrder(orderNo: string): Promise<void> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.close', {}, {
      bizContent: {
        outTradeNo: orderNo,
      },
    });

    logger.info('Alipay order closed', { orderNo, code: result?.code });
  } catch (error: any) {
    logger.error('Alipay order close failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '关闭支付宝订单失败');
  }
}

// 申请退款
export async function refundAlipayOrder(
  orderNo: string,
  refundOrderNo: string,
  refundAmount: number,
  refundReason: string = '正常退款'
): Promise<{ fund_change: string }> {
  if (!alipaySdk) {
    initAlipay();
  }

  if (!alipaySdk) {
    throw new AppError(500, '支付宝未配置');
  }

  try {
    const result = await alipaySdk.exec('alipay.trade.refund', {}, {
      bizContent: {
        outTradeNo: orderNo,
        outRequestNo: refundOrderNo,
        refundAmount: refundAmount.toFixed(2),
        refundReason: refundReason,
      },
    });

    logger.info('Alipay refund created', { orderNo, refundOrderNo, fundChange: result?.fundChange });

    return {
      fund_change: result?.fundChange || 'N',
    };
  } catch (error: any) {
    logger.error('Alipay refund creation failed', {
      error: error.message,
      orderNo,
    });
    throw new AppError(500, error.message || '申请退款失败');
  }
}

export default {
  createAlipayWebPayOrder,
  createAlipayWapPayOrder,
  createAlipayQRCodePayOrder,
  verifyAlipayNotify,
  queryAlipayOrder,
  closeAlipayOrder,
  refundAlipayOrder,
};
