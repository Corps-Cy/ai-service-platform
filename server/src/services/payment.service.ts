import crypto from 'crypto';

// 微信支付签名
export function wechatSign(params: any, apiKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== '')
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const stringSignTemp = `${stringA}&key=${apiKey}`;
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
}

// 验证微信支付签名
export function verifyWechatSign(params: any, apiKey: string): boolean {
  const sign = params.sign;
  delete params.sign;
  const calculatedSign = wechatSign(params, apiKey);
  return sign === calculatedSign;
}

// 支付宝签名
export function alipaySign(params: any, privateKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== '' && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // 这里简化处理，实际需要使用 RSA 签名
  // 实际项目中应使用 alipay-sdk
  return crypto.createHash('sha256').update(stringA).digest('hex');
}

// 生成订单号
export function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER${timestamp}${random}`.toUpperCase();
}

// 生成任务ID
export function generateTaskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `TASK${timestamp}${random}`.toUpperCase();
}
