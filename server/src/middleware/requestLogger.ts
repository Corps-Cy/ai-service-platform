import { Request, Response, NextFunction } from 'express';
import logger from './logger';

interface RequestWithUser extends Request {
  userId?: number;
  user?: any;
}

const requestLogger = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'];
  const userId = req.userId || req.user?.id;

  const startTime = Date.now();

  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.http({
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent,
      userId,
    });
  });

  next();
};

export default requestLogger;
