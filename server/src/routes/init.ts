import { Router, Request, Response } from 'express';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 默认 JWT 密钥 - 与 auth.ts 中的默认值一致
const DEFAULT_JWT_SECRET = 'ai-platform-default-jwt-secret-key-2024';

// 获取.env文件路径
const getEnvPath = () => {
  const possiblePaths = [
    join(__dirname, '../../.env'),
    join(__dirname, '../../server/.env'),
    '/app/.env',
    '/app/server/.env',
    join(process.cwd(), '.env'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return join(process.cwd(), '.env');
};

// 检查是否已配置
router.get('/status', async (req: Request, res: Response) => {
  try {
    const envPath = getEnvPath();

    if (!existsSync(envPath)) {
      return res.json({ 
        configured: false,
        hasDefaultJwtSecret: true, // 使用默认值，可以正常使用
      });
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const hasZhipuKey = envContent.includes('ZHIPU_API_KEY') && !envContent.includes('your_zhipu_api_key_here');
    const hasJwtSecret = envContent.includes('JWT_SECRET') && !envContent.includes('your-secret-key');

    const configured = hasZhipuKey;

    logger.info('Config status check', {
      envPath,
      configured,
      hasZhipuKey,
      hasJwtSecret,
    });

    return res.json({ 
      configured, 
      envPath,
      hasJwtSecret,
      hasDefaultJwtSecret: true, // 总是返回 true，因为有默认值
    });
  } catch (error: any) {
    logger.error('Config status check error', { error: error.message });
    return res.json({ 
      configured: false,
      hasDefaultJwtSecret: true,
    });
  }
});

// 保存配置
router.post('/save-config', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    logger.info('Saving configuration...');

    // 构建.env文件内容
    let envContent = `# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_PATH=${config.databasePath || './data/database.sqlite'}

# Frontend
FRONTEND_URL=${process.env.FRONTEND_URL || 'http://localhost'}

# ZhipuAI Configuration
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_API_KEY=${config.zhipuApiKey || ''}

# JWT Secret - 使用用户提供的值或默认值
JWT_SECRET=${config.jwtSecret || DEFAULT_JWT_SECRET}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_DELAY_MS=1000

# Task Queue Configuration
REDIS_HOST=${config.redisHost || 'localhost'}
REDIS_PORT=${config.redisPort || '6379'}
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_DB=1
`;

    // 添加邮件配置（如果提供）
    if (config.emailHost && config.emailUser && config.emailPassword) {
      envContent += `
# Email Configuration
EMAIL_HOST=${config.emailHost}
EMAIL_PORT=${config.emailPort || '587'}
EMAIL_SECURE=false
EMAIL_USER=${config.emailUser}
EMAIL_PASSWORD=${config.emailPassword}
EMAIL_FROM=${config.emailFrom || 'noreply@example.com'}
EMAIL_FROM_NAME=AI Service Platform
`;
    }

    // 添加微信支付配置（如果提供）
    if (config.wechatAppid && config.wechatMchid) {
      envContent += `
# WeChat Pay Configuration
WECHAT_APPID=${config.wechatAppid}
WECHAT_MCHID=${config.wechatMchid}
WECHAT_SERIAL_NO=${config.wechatSerialNo || ''}
WECHAT_PRIVATE_KEY=${config.wechatPrivateKey || ''}
WECHAT_NOTIFY_URL=${process.env.FRONTEND_URL || 'http://localhost:80'}/api/payment/wechat/notify
`;
    }

    // 添加支付宝配置（如果提供）
    if (config.alipayAppid && config.alipayPrivateKey) {
      envContent += `
# Alipay Configuration
ALIPAY_APPID=${config.alipayAppid}
ALIPAY_PRIVATE_KEY=${config.alipayPrivateKey}
ALIPAY_PUBLIC_KEY=${config.alipayPublicKey || ''}
ALIPAY_NOTIFY_URL=${process.env.FRONTEND_URL || 'http://localhost:80'}/api/payment/alipay/notify
`;
    }

    // 添加管理员邮箱（使用第一个邮箱）
    if (config.emailUser) {
      envContent += `
# Admin Configuration
ADMIN_EMAILS=${config.emailUser}
`;
    }

    // 确定写入路径
    const envPath = getEnvPath();

    // 确保目录存在
    const fs = await import('fs');
    const path = await import('path');

    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }

    // 写入.env文件
    writeFileSync(envPath, envContent, 'utf-8');

    logger.info('Configuration saved', { envPath });

    return res.json({
      success: true,
      envPath,
      message: '配置已保存，服务将自动重启',
    });
  } catch (error: any) {
    logger.error('Save configuration error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || '保存配置失败',
    });
  }
});

// 获取当前配置（用于编辑）
router.get('/current', async (req: Request, res: Response) => {
  try {
    const envPath = getEnvPath();

    if (!existsSync(envPath)) {
      return res.json({ 
        configured: false,
        jwtSecret: DEFAULT_JWT_SECRET, // 返回默认值
      });
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const config: Record<string, string> = {};

    // 解析.env文件
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          config[key] = valueParts.join('=');
        }
      }
    }

    return res.json({
      configured: true,
      config: {
        zhipuApiKey: config.ZHIPU_API_KEY || '',
        jwtSecret: config.JWT_SECRET || DEFAULT_JWT_SECRET,
        databasePath: config.DATABASE_PATH || '',
        redisHost: config.REDIS_HOST || '',
        redisPort: config.REDIS_PORT || '',
        emailHost: config.EMAIL_HOST || '',
        emailPort: config.EMAIL_PORT || '',
        emailUser: config.EMAIL_USER || '',
        emailFrom: config.EMAIL_FROM || '',
        wechatAppid: config.WECHAT_APPID || '',
        wechatMchid: config.WECHAT_MCHID || '',
        wechatSerialNo: config.WECHAT_SERIAL_NO || '',
        wechatPrivateKey: config.WECHAT_PRIVATE_KEY || '',
        alipayAppid: config.ALIPAY_APPID || '',
        alipayPrivateKey: config.ALIPAY_PRIVATE_KEY || '',
        alipayPublicKey: config.ALIPAY_PUBLIC_KEY || '',
      },
    });
  } catch (error: any) {
    logger.error('Get current config error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || '获取配置失败',
    });
  }
});

export default router;
