import { Router, Request, Response } from 'express';
import { getDatabase } from '../models/database.js';

const router = Router();

// 认证中间件
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

// 获取用户信息
router.get('/info', authMiddleware, async (req: any, res: Response) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, nickname, created_at FROM users WHERE id = ?').get(req.userId);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户tokens
    const userTokens = db.prepare('SELECT tokens, expires_at FROM user_tokens WHERE user_id = ?').get(req.userId) as any;

    // 获取用户订阅
    const subscription = db.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY expires_at DESC LIMIT 1'
    ).get(req.userId, 'active') as any;

    res.json({
      user: {
        ...user,
        tokens: userTokens?.tokens || 0,
        tokensExpiresAt: userTokens?.expires_at,
        subscription: subscription ? {
          plan: subscription.plan,
          expiresAt: subscription.expires_at
        } : null
      }
    });
  } catch (error: any) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/info', authMiddleware, async (req: any, res: Response) => {
  try {
    const { nickname } = req.body;

    const db = getDatabase();

    if (nickname) {
      db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, req.userId);
    }

    const user = db.prepare('SELECT id, email, nickname FROM users WHERE id = ?').get(req.userId);

    res.json({
      message: '更新成功',
      user
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

export default router;
