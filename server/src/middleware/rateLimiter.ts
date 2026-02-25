import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// 通用API限流
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userId: (req as any).userId,
    });
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: '15分钟',
    });
  },
});

// 登录限流
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次登录尝试
  message: '登录尝试过多，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json({
      error: '登录尝试过多，请1小时后再试',
      retryAfter: '1小时',
    });
  },
});

// 文件上传限流
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次上传
  message: '上传过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).userId,
    });
    res.status(429).json({
      error: '上传过于频繁，请稍后再试',
      retryAfter: '1小时',
    });
  },
});

// API密钥限流
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1分钟
  max: 30, // 最多30次API调用
  message: 'API调用过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logger.warn('API key rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).userId,
    });
    res.status(429).json({
      error: 'API调用过于频繁，请稍后再试',
      retryAfter: '1分钟',
    });
  },
});
