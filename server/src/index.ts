import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './models/database.js';
import routes from './routes/index.js';
import logger from './utils/logger.js';
import requestLogger from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import { getQueueStats, closeQueues } from './queue/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// JSON 和 URL 解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static(join(__dirname, '../../uploads')));

// 基础限流（所有请求）
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 最多1000个请求
  message: '服务器繁忙，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
}));

// 请求日志（所有路由之前）
app.use(requestLogger);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 队列统计
app.get('/api/admin/queue-stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Get queue stats error', { error: error.message });
    res.status(500).json({ error: '获取队列统计失败' });
  }
});

// 初始化数据库
initDatabase();

logger.info('🚀 Starting AI Service Platform server...');

// API 路由
app.use('/api', routes);

// 错误处理（必须放在所有路由之后）
app.use(errorHandler);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📊 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await closeQueues();
    logger.info('✅ Queues closed successfully');

    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
