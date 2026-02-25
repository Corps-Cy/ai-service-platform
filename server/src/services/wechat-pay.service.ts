import { Formatter, Rsa, Aes } from 'wechatpay-node-v3';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// 微信支付配置
const WECHAT_CONFIG = {
  appid: process.env.WECHAT_APPID || '',
  mchid: process.env.WECHAT_MCHID || '',
  serial_no: process.env.WECHAT_SERIAL_NO || '',
  apiv3_private_key_path: process.env.WECHAT_PRIVATE_KEY_PATH || '',
  apiv3_private_key: process.env.WECHAT_PRIVATE_KEY || '',
  wechatpay_serial: process.env.WECHAT_SERIAL_NO || '',
  notify_url: process.env.WECHAT_NOTIFY_URL || 'https://yourdomain.com/api/payment/wechat/notify'
};

// 初始化微信支付客户端
let wechatpay: any = null;

function initWeChatPay() {
  try {
    if (!WECHAT_CONFIG.apiv3_private_key_path && !WECHAT_CONFIG.apiv3_private_key) {
      throw new Error('微信支付私钥未配置');
    }

    const privateKey = WECHAT_CONFIG.apiv3_private_key_path
      ? fs.readFileSync(path.resolve(WECHAT_CONFIG.apiv3_private_key_path)).toString()
      : WECHAT_CONFIG.apiv3_private_key;

    wechatpay = new Rsa({
      serial_no: WECHAT_CONFIG.serial_no,
      private_key: privateKey,
      mchid: WECHAT_CONFIG.mchid,
      appid: WECHAT_CONFIG.appid,
      apiv3_private_key: privateKey,
    });

    logger.info('WeChat Pay initialized');
  } catch (error: any) {
    logger.error('Failed to initialize WeChat Pay', { error: error.message });
    wechatpay = null;
  }
}

// 创建微信支付订单（Native支付 - 返回二维码）
export async function createWeChatNativePayOrder(
  orderNo: string,
  description: string,
  totalAmount: number, // 单位：分
  expireMinutes: number = 30
): Promise<{ code_url: string; prepay_id: string } | null> {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const params = {
      appid: WECHAT_CONFIG.appid,
      mchid: WECHAT_CONFIG.mchid,
      description,
      out_trade_no: orderNo,
      notify_url: WECHAT_CONFIG.notify_url,
      amount: {
        total: totalAmount,
        currency: 'CNY',
      },
      time_expire: new Date(Date.now() + expireMinutes * 60000).toISOString(),
    };

    // 调用统一下单API
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';
    const result = await wechatpay.request('POST', url, params);

    logger.info('WeChat Native order created', { orderNo, prepay_id: result.prepay_id });

    return {
      code_url: result.code_url,
      prepay_id: result.prepay_id,
    };
  } catch (error: any) {
    logger.error('WeChat Native order creation failed', {
      error: error.response?.data || error.message,
      orderNo,
    });
    throw new AppError(500, error.response?.data?.message || '创建微信支付订单失败');
  }
}

// 创建微信支付订单（H5支付 - 返回支付链接）
export async function createWeChatH5PayOrder(
  orderNo: string,
  description: string,
  totalAmount: number,
  sceneInfo: any
): Promise<{ h5_url: string; prepay_id: string } | null> {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const params = {
      appid: WECHAT_CONFIG.appid,
      mchid: WECHAT_CONFIG.mchid,
      description,
      out_trade_no: orderNo,
      notify_url: WECHAT_CONFIG.notify_url,
      amount: {
        total: totalAmount,
        currency: 'CNY',
      },
      scene_info: sceneInfo,
    };

    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/h5';
    const result = await wechatpay.request('POST', url, params);

    logger.info('WeChat H5 order created', { orderNo, prepay_id: result.prepay_id });

    return {
      h5_url: result.h5_url,
      prepay_id: result.prepay_id,
    };
  } catch (error: any) {
    logger.error('WeChat H5 order creation failed', {
      error: error.response?.data || error.message,
      orderNo,
    });
    throw new AppError(500, error.response?.data?.message || '创建微信支付订单失败');
  }
}

// 验证微信支付回调签名
export function verifyWeChatNotifySignature(
  body: string,
  signature: string,
  timestamp: string,
  nonce: string
): boolean {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    return false;
  }

  try {
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    const valid = wechatpay.verify(message, signature);

    if (!valid) {
      logger.warn('WeChat notify signature verification failed');
    }

    return valid;
  } catch (error: any) {
    logger.error('WeChat notify signature verification error', { error: error.message });
    return false;
  }
}

// 解密微信支付回调数据
export function decryptWeChatNotifyData(associatedData: string, nonce: string, ciphertext: string): any {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const result = wechatpay.decrypt(associatedData, nonce, ciphertext);
    logger.info('WeChat notify data decrypted');
    return result;
  } catch (error: any) {
    logger.error('WeChat notify data decryption error', { error: error.message });
    throw new AppError(500, '解密支付数据失败');
  }
}

// 查询微信支付订单
export async function queryWeChatOrder(orderNo: string): Promise<any> {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${WECHAT_CONFIG.mchid}`;
    const result = await wechatpay.request('GET', url);

    logger.info('WeChat order queried', { orderNo, trade_state: result.trade_state });

    return result;
  } catch (error: any) {
    logger.error('WeChat order query failed', {
      error: error.response?.data || error.message,
      orderNo,
    });
    throw new AppError(500, '查询微信支付订单失败');
  }
}

// 关闭微信支付订单
export async function closeWeChatOrder(orderNo: string): Promise<void> {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}/close`;
    await wechatpay.request('POST', url, { mchid: WECHAT_CONFIG.mchid });

    logger.info('WeChat order closed', { orderNo });
  } catch (error: any) {
    logger.error('WeChat order close failed', {
      error: error.response?.data || error.message,
      orderNo,
    });
    throw new AppError(500, '关闭微信支付订单失败');
  }
}

// 申请退款
export async function refundWeChatOrder(
  orderNo: string,
  refundOrderNo: string,
  totalAmount: number,
  refundAmount: number
): Promise<{ refund_id: string }> {
  if (!wechatpay) {
    initWeChatPay();
  }

  if (!wechatpay) {
    throw new AppError(500, '微信支付未配置');
  }

  try {
    const params = {
      out_trade_no: orderNo,
      out_refund_no: refundOrderNo,
      amount: {
        refund: refundAmount,
        total: totalAmount,
        currency: 'CNY',
      },
    };

    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds';
    const result = await wechatpay.request('POST', url, params);

    logger.info('WeChat refund created', { orderNo, refundOrderNo, refund_id: result.refund_id });

    return { refund_id: result.refund_id };
  } catch (error: any) {
    logger.error('WeChat refund creation failed', {
      error: error.response?.data || error.message,
      orderNo,
    });
    throw new AppError(500, '申请退款失败');
  }
}

export default {
  createWeChatNativePayOrder,
  createWeChatH5PayOrder,
  verifyWeChatNotifySignature,
  decryptWeChatNotifyData,
  queryWeChatOrder,
  closeWeChatOrder,
  refundWeChatOrder,
};
