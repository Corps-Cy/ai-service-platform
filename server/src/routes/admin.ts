import { Router, Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueueStats } from '../queue/index.js';
import { getCacheStats } from '../services/cache.service.js';

const router = Router();

// 管理员认证中间件
const adminAuthMiddleware = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 检查是否为管理员（这里简化处理，实际应该在数据库中存储用户角色）
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(decoded.email)) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的token' });
  }
};

// 获取统计概览
router.get('/stats', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // 用户统计
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const todayUsers = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')"
    ).get() as any;

    // 订单统计
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const paidOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'paid'").get() as any;
    const todayOrders = db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')"
    ).get() as any;
    const todayRevenue = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid' AND DATE(created_at) = DATE('now')"
    ).get() as any;

    // 订阅统计
    const activeSubscriptions = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get() as any;

    // 任务统计
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as any;
    const todayTasks = db.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE DATE(created_at) = DATE('now')"
    ).get() as any;

    // 队列和缓存统计
    const queueStats = await getQueueStats();
    const cacheStats = await getCacheStats();

    res.json({
      users: {
        total: totalUsers.count,
        today: todayUsers.count,
      },
      orders: {
        total: totalOrders.count,
        paid: paidOrders.count,
        today: todayOrders.count,
        todayRevenue: todayRevenue.total || 0,
      },
      subscriptions: {
        active: activeSubscriptions.count,
      },
      tasks: {
        total: totalTasks.count,
        completed: completedTasks.count,
        today: todayTasks.count,
      },
      queue: queueStats,
      cache: cacheStats,
    });
  } catch (error: any) {
    logger.error('Get admin stats error', { error: error.message });
    res.status(500).json({ error: error.message || '获取统计数据失败' });
  }
});

// 获取用户列表
router.get('/users', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const db = getDatabase();

    let query = 'SELECT id, email, nickname, created_at FROM users';
    let params: any[] = [];

    if (search) {
      query += ' WHERE email LIKE ? OR nickname LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const users = db.prepare(query).all(...params);

    // 获取总数量
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    let countParams: any[] = [];

    if (search) {
      countQuery += ' WHERE email LIKE ? OR nickname LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.count,
        pages: Math.ceil(total.count / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json({ error: error.message || '获取用户列表失败' });
  }
});

// 获取用户详情
router.get('/users/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;

    const user = db.prepare('SELECT id, email, nickname, created_at FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户tokens
    const tokens = db.prepare('SELECT tokens, expires_at FROM user_tokens WHERE user_id = ?').get(userId) as any;

    // 获取用户订阅
    const subscription = db.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(userId) as any;

    // 获取用户订单
    const orders = db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(userId);

    // 获取用户任务
    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(userId);

    res.json({
      user,
      tokens,
      subscription,
      orders,
      tasks,
    });
  } catch (error: any) {
    logger.error('Get user details error', { error: error.message });
    res.status(500).json({ error: error.message || '获取用户详情失败' });
  }
});

// 更新用户信息
router.put('/users/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body;
    const userId = req.params.id;

    const db = getDatabase();

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 更新用户信息
    if (nickname !== undefined) {
      db.prepare('UPDATE users SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(nickname, userId);
    }

    logger.info('User updated by admin', { userId });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json({ error: error.message || '更新用户失败' });
  }
});

// 删除用户
router.delete('/users/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const db = getDatabase();

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 删除用户相关数据（级联删除）
    db.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_tokens WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    logger.info('User deleted by admin', { userId });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json({ error: error.message || '删除用户失败' });
  }
});

// 获取订单列表
router.get('/orders', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = '', userId = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const db = getDatabase();

    let query = 'SELECT o.*, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
    let params: any[] = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND o.user_id = ?';
      params.push(Number(userId));
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const orders = db.prepare(query).all(...params);

    // 获取总数量
    let countQuery = 'SELECT COUNT(*) as count FROM orders WHERE 1=1';
    let countParams: any[] = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(Number(userId));
    }

    const total = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.count,
        pages: Math.ceil(total.count / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Get orders error', { error: error.message });
    res.status(500).json({ error: error.message || '获取订单列表失败' });
  }
});

// 获取订单详情
router.get('/orders/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const orderId = req.params.id;

    const order = db.prepare(
      'SELECT o.*, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?'
    ).get(orderId);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({ order });
  } catch (error: any) {
    logger.error('Get order details error', { error: error.message });
    res.status(500).json({ error: error.message || '获取订单详情失败' });
  }
});

// 更新订单状态
router.put('/orders/:id/status', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!['pending', 'paid', 'refunded', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const db = getDatabase();
    const orderId = req.params.id;

    const result = db.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    ).run(status, orderId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    logger.info('Order status updated by admin', { orderId, status });

    res.json({ success: true, status });
  } catch (error: any) {
    logger.error('Update order status error', { error: error.message });
    res.status(500).json({ error: error.message || '更新订单状态失败' });
  }
});

// 获取订阅列表
router.get('/subscriptions', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const db = getDatabase();

    let query = 'SELECT s.*, u.email FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id WHERE 1=1';
    let params: any[] = [];

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const subscriptions = db.prepare(query).all(...params);

    // 获取总数量
    let countQuery = 'SELECT COUNT(*) as count FROM subscriptions WHERE 1=1';
    let countParams: any[] = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const total = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.count,
        pages: Math.ceil(total.count / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Get subscriptions error', { error: error.message });
    res.status(500).json({ error: error.message || '获取订阅列表失败' });
  }
});

// 更新订阅状态
router.put('/subscriptions/:id/status', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!['active', 'expired', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '无效的订阅状态' });
    }

    const db = getDatabase();
    const subscriptionId = req.params.id;

    const result = db.prepare(
      'UPDATE subscriptions SET status = ? WHERE id = ?'
    ).run(status, subscriptionId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '订阅不存在' });
    }

    logger.info('Subscription status updated by admin', { subscriptionId, status });

    res.json({ success: true, status });
  } catch (error: any) {
    logger.error('Update subscription status error', { error: error.message });
    res.status(500).json({ error: error.message || '更新订阅状态失败' });
  }
});

// 获取套餐列表
router.get('/plans', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const plans = db.prepare('SELECT * FROM plans ORDER BY price').all();

    res.json({ plans });
  } catch (error: any) {
    logger.error('Get plans error', { error: error.message });
    res.status(500).json({ error: error.message || '获取套餐列表失败' });
  }
});

// 创建套餐
router.post('/plans', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, type, price, duration, tokens, features } = req.body;

    if (!name || !type || !price || !duration || !tokens) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const db = getDatabase();

    const result = db.prepare(
      'INSERT INTO plans (name, type, price, duration, tokens, features) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, type, price, duration, tokens, JSON.stringify(features || []));

    logger.info('Plan created by admin', { name, type, price });

    res.json({
      success: true,
      planId: result.lastInsertRowid,
    });
  } catch (error: any) {
    logger.error('Create plan error', { error: error.message });
    res.status(500).json({ error: error.message || '创建套餐失败' });
  }
});

// 更新套餐
router.put('/plans/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, type, price, duration, tokens, features, is_active } = req.body;
    const planId = req.params.id;

    const db = getDatabase();

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(price);
    }
    if (duration !== undefined) {
      updateFields.push('duration = ?');
      updateValues.push(duration);
    }
    if (tokens !== undefined) {
      updateFields.push('tokens = ?');
      updateValues.push(tokens);
    }
    if (features !== undefined) {
      updateFields.push('features = ?');
      updateValues.push(JSON.stringify(features));
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    updateValues.push(planId);

    const result = db.prepare(
      `UPDATE plans SET ${updateFields.join(', ')} WHERE id = ?`
    ).run(...updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: '套餐不存在' });
    }

    logger.info('Plan updated by admin', { planId });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Update plan error', { error: error.message });
    res.status(500).json({ error: error.message || '更新套餐失败' });
  }
});

// 删除套餐
router.delete('/plans/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const planId = req.params.id;

    const result = db.prepare('DELETE FROM plans WHERE id = ?').run(planId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '套餐不存在' });
    }

    logger.info('Plan deleted by admin', { planId });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete plan error', { error: error.message });
    res.status(500).json({ error: error.message || '删除套餐失败' });
  }
});

// 获取收入统计（按日期）
router.get('/revenue', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const db = getDatabase();

    // SQLite的日期函数可能有限，这里使用简化查询
    const revenue = db.prepare(`
      SELECT
        DATE(paid_at) as date,
        COUNT(*) as orders,
        SUM(amount) as total
      FROM orders
      WHERE status = 'paid'
        AND paid_at IS NOT NULL
        AND paid_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(paid_at)
      ORDER BY date DESC
    `).all(Number(days));

    res.json({ revenue });
  } catch (error: any) {
    logger.error('Get revenue stats error', { error: error.message });
    res.status(500).json({ error: error.message || '获取收入统计失败' });
  }
});

// 获取任务统计（按类型）
router.get('/tasks/stats', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const stats = db.prepare(`
      SELECT
        type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(tokens_used) as avg_tokens
      FROM tasks
      GROUP BY type
    `).all();

    res.json({ stats });
  } catch (error: any) {
    logger.error('Get task stats error', { error: error.message });
    res.status(500).json({ error: error.message || '获取任务统计失败' });
  }
});

// 手动触发订阅到期检查
router.post('/subscriptions/check-expiry', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // 查找已到期的订阅
    const expiredSubscriptions = db.prepare(`
      SELECT * FROM subscriptions
      WHERE status = 'active'
        AND expires_at <= datetime('now')
    `).all();

    let updatedCount = 0;

    for (const sub of expiredSubscriptions) {
      db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run('expired', sub.id);
      updatedCount++;

      logger.info('Subscription expired', { subscriptionId: sub.id, userId: sub.user_id });

      // 发送到期提醒邮件
      const user = db.prepare('SELECT email, nickname FROM users WHERE id = ?').get(sub.user_id) as any;
      if (user?.email) {
        const expiresAt = new Date(sub.expires_at);
        await emailQueue.add('send-email', {
          type: 'subscription-expiring',
          email: user.email,
          planName: sub.plan,
          expiresAt,
          daysLeft: 0,
        });
      }
    }

    res.json({
      success: true,
      updatedCount,
    });
  } catch (error: any) {
    logger.error('Check subscription expiry error', { error: error.message });
    res.status(500).json({ error: error.message || '检查订阅到期失败' });
  }
});

// 手动触发即将到期订阅提醒
router.post('/subscriptions/send-expiry-reminders', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.body;
    const db = getDatabase();

    // 查找即将到期的活跃订阅
    const expiringSubscriptions = db.prepare(`
      SELECT s.*, u.email, u.nickname
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.expires_at BETWEEN datetime('now') AND datetime('now', '+' || ? || ' days')
    `).all(Number(days));

    let sentCount = 0;

    for (const sub of expiringSubscriptions) {
      const expiresAt = new Date(sub.expires_at);
      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      await emailQueue.add('send-email', {
        type: 'subscription-expiring',
        email: sub.email,
        planName: sub.plan,
        expiresAt,
        daysLeft,
      });

      sentCount++;

      logger.info('Subscription expiry reminder sent', {
        subscriptionId: sub.id,
        userId: sub.user_id,
        daysLeft,
      });
    }

    res.json({
      success: true,
      sentCount,
    });
  } catch (error: any) {
    logger.error('Send subscription expiry reminders error', { error: error.message });
    res.status(500).json({ error: error.message || '发送到期提醒失败' });
  }
});

export default router;
