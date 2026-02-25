import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../models/database.js';

const router = Router();

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码必填' });
    }

    const db = getDatabase();

    // 检查邮箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = db.prepare(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, nickname || email.split('@')[0]);

    // 创建token记录
    db.prepare(
      'INSERT INTO user_tokens (user_id, tokens, expires_at) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, 0, null);

    // 生成JWT
    const token = jwt.sign(
      { userId: result.lastInsertRowid, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        nickname: nickname || email.split('@')[0]
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码必填' });
    }

    const db = getDatabase();

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // 获取用户token余额
    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(user.id) as any;

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        tokens: userTokens?.tokens || 0
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

export default router;
