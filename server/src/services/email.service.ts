import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// 邮件配置
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  fromName: process.env.EMAIL_FROM_NAME || 'AI Service Platform',
};

// 创建邮件传输器
let transporter: Transporter | null = null;

function initTransporter() {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      throw new Error('Email credentials not configured');
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    logger.info('Email transporter initialized', {
      host: emailConfig.host,
      from: emailConfig.from,
    });
  } catch (error: any) {
    logger.error('Failed to initialize email transporter', { error: error.message });
    transporter = null;
  }
}

// 发送邮件
async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    throw new AppError(500, '邮件服务未配置');
  }

  try {
    const info = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info('Email sent', {
      to,
      subject,
      messageId: info.messageId,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message,
    });
    throw new AppError(500, '发送邮件失败');
  }
}

// 邮件模板基础样式
const emailStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background-color: #10B981;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 20px;
    }
    .button:hover {
      background-color: #059669;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 500;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      font-weight: 600;
    }
  </style>
`;

// 发送订单创建邮件
export async function sendOrderCreatedEmail(
  to: string,
  orderNo: string,
  amount: number,
  paymentMethod: string,
  description: string
): Promise<void> {
  const subject = '订单创建成功';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 订单创建成功</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>您的订单已成功创建，请使用以下方式完成支付：</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">订单号</span>
                <span class="info-value">${orderNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">金额</span>
                <span class="info-value">¥${amount.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">支付方式</span>
                <span class="info-value">${paymentMethod === 'wechat' ? '微信支付' : '支付宝'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">订单内容</span>
                <span class="info-value">${description}</span>
              </div>
            </div>
            <p>订单有效期30分钟，请及时完成支付。</p>
            <p>如有问题，请联系客服。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送支付成功邮件
export async function sendPaymentSuccessEmail(
  to: string,
  orderNo: string,
  amount: number,
  productType: string,
  productName: string
): Promise<void> {
  const subject = '支付成功';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ 支付成功</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>您的订单已支付成功，感谢您的购买！</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">订单号</span>
                <span class="info-value">${orderNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">支付金额</span>
                <span class="info-value">¥${amount.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">购买类型</span>
                <span class="info-value">${productType === 'plan' ? '套餐' : 'Tokens充值'}</span>
              </div>
              ${productName ? `
                <div class="info-row">
                  <span class="info-label">产品名称</span>
                  <span class="info-value">${productName}</span>
                </div>
              ` : ''}
            </div>
            ${productType === 'plan' ? `
              <p>您的套餐已自动激活，可以立即开始使用各项服务。</p>
            ` : `
              <p>您的Tokens已自动充值到账户，可以立即使用。</p>
            `}
            <p>如有问题，请联系客服。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送任务完成邮件
export async function sendTaskCompletedEmail(
  to: string,
  taskId: string,
  taskType: string,
  resultSummary: string
): Promise<void> {
  const typeNames: Record<string, string> = {
    'text-gen': '文本生成',
    'image-gen': '图片生成',
    'image-understand': '图片理解',
    'document-process': '文档处理',
    'excel-process': 'Excel操作',
  };

  const subject = '任务完成';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 任务完成</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>您的AI任务已处理完成。</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">任务ID</span>
                <span class="info-value">${taskId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">任务类型</span>
                <span class="info-value">${typeNames[taskType] || taskType}</span>
              </div>
            </div>
            <p><strong>结果摘要：</strong></p>
            <p>${resultSummary}</p>
            <p>您可以在任务管理页面查看完整结果。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送订阅到期提醒邮件
export async function sendSubscriptionExpiringEmail(
  to: string,
  planName: string,
  expiresAt: Date,
  daysLeft: number
): Promise<void> {
  const subject = '订阅即将到期提醒';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ 订阅即将到期</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>您的订阅套餐即将到期，为了避免影响您的使用体验，请及时续费。</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">当前套餐</span>
                <span class="info-value">${planName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">到期时间</span>
                <span class="info-value">${expiresAt.toLocaleDateString('zh-CN')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">剩余天数</span>
                <span class="info-value">${daysLeft} 天</span>
              </div>
            </div>
            <p>续费后将自动延长您的订阅有效期，感谢您的支持！</p>
            <p>如有问题，请联系客服。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送欢迎邮件
export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  const subject = '欢迎加入 AI Service Platform';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 欢迎加入</h1>
          </div>
          <div class="content">
            <p>您好，${username}！</p>
            <p>感谢您注册 AI Service Platform，我们为您提供强大的AI服务：</p>
            <ul style="line-height: 2;">
              <li>🎨 AI文生图</li>
              <li>📝 智能文本生成</li>
              <li>🔍 图片理解</li>
              <li>📄 文档处理</li>
              <li>📊 Excel操作</li>
            </ul>
            <p>立即开始探索AI的无限可能吧！</p>
            <p>如有任何问题，欢迎联系我们的客服团队。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const subject = '密码重置';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 密码重置</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>我们收到了您的密码重置请求，请点击以下链接重置您的密码：</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">重置密码</a>
            </div>
            <p>该链接有效期为30分钟。</p>
            <p>如果您没有申请重置密码，请忽略此邮件。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// 发送退款成功邮件
export async function sendRefundSuccessEmail(
  to: string,
  orderNo: string,
  refundAmount: number,
  refundReason: string
): Promise<void> {
  const subject = '退款成功';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 退款成功</h1>
          </div>
          <div class="content">
            <p>您好！</p>
            <p>您的退款申请已处理完成。</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">订单号</span>
                <span class="info-value">${orderNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">退款金额</span>
                <span class="info-value">¥${refundAmount.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">退款原因</span>
                <span class="info-value">${refundReason}</span>
              </div>
            </div>
            <p>退款将在1-3个工作日内原路返回至您的支付账户，请留意查收。</p>
            <p>如有问题，请联系客服。</p>
          </div>
          <div class="footer">
            <p>AI Service Platform</p>
            <p>此邮件由系统自动发送，请勿直接回复</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

export default {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
  sendTaskCompletedEmail,
  sendSubscriptionExpiringEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRefundSuccessEmail,
};
