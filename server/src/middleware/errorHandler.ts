import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode, message } = err as AppError;

  // 记录错误
  logger.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      userId: (req as any).userId,
    },
  });

  // 处理已知的应用错误
  if (err instanceof AppError) {
    return res.status(statusCode).json({
      error: message,
      statusCode,
    });
  }

  // 处理Zod验证错误
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: (err as any).issues,
      statusCode: 400,
    });
  }

  // 默认500错误
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};

const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 - ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not found',
    statusCode: 404,
  });
};

export { AppError, errorHandler, notFoundHandler };
