import { Router, Request, Response } from 'express';
import { zhipuService } from '../services/zhipu.service.js';
import { getDatabase } from '../models/database.js';
import { generateTaskId } from '../services/payment.service.js';

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

// 文生图
router.post('/image', authMiddleware, async (req: any, res: Response) => {
  try {
    const { prompt, size, num } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '提示词必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    // 检查余额（这里简化处理，实际应该在middleware中统一处理）
    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < 200) {
      return res.status(400).json({ error: '余额不足' });
    }

    // 创建任务
    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'text_to_image', 'processing', JSON.stringify({ prompt }));

    // 调用智谱API
    const result = await zhipuService.generateImage({ prompt, size, num });

    // 更新任务状态
    db.prepare(
      'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
    ).run('completed', JSON.stringify(result), taskId);

    // 扣除tokens
    db.prepare('UPDATE user_tokens SET tokens = tokens - 200 WHERE user_id = ?').run(req.userId);

    res.json({
      taskId,
      status: 'completed',
      result
    });
  } catch (error: any) {
    console.error('Image task error:', error);
    res.status(500).json({ error: error.message || '图片生成失败' });
  }
});

// 文本生成
router.post('/text', authMiddleware, async (req: any, res: Response) => {
  try {
    const { model, messages, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '消息必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    // 简单估算tokens消耗
    const estimatedTokens = 100;

    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < estimatedTokens) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'text_generate', 'processing', JSON.stringify({ messages }));

    const result = await zhipuService.generateText({ model, messages, temperature, max_tokens: maxTokens });

    db.prepare(
      'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
    ).run('completed', JSON.stringify(result), taskId);

    // 扣除tokens（简化处理，实际应根据实际消耗）
    db.prepare('UPDATE user_tokens SET tokens = tokens - ? WHERE user_id = ?').run(estimatedTokens, req.userId);

    res.json({
      taskId,
      status: 'completed',
      result
    });
  } catch (error: any) {
    console.error('Text task error:', error);
    res.status(500).json({ error: error.message || '文本生成失败' });
  }
});

// 图片理解
router.post('/image-understand', authMiddleware, async (req: any, res: Response) => {
  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: '图片和提示词必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < 100) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'image_understand', 'processing', JSON.stringify({ image: '[IMAGE]', prompt }));

    const result = await zhipuService.understandImage({ image, prompt });

    db.prepare(
      'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
    ).run('completed', JSON.stringify(result), taskId);

    db.prepare('UPDATE user_tokens SET tokens = tokens - 100 WHERE user_id = ?').run(req.userId);

    res.json({
      taskId,
      status: 'completed',
      result
    });
  } catch (error: any) {
    console.error('Image understand error:', error);
    res.status(500).json({ error: error.message || '图片理解失败' });
  }
});

// 文档处理
router.post('/document', authMiddleware, async (req: any, res: Response) => {
  try {
    const { content, task } = req.body;

    if (!content || !task) {
      return res.status(400).json({ error: '内容和任务必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < 200) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'document_process', 'processing', JSON.stringify({ content: content.substring(0, 100), task }));

    const result = await zhipuService.parseDocument(content, task);

    db.prepare(
      'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
    ).run('completed', JSON.stringify(result), taskId);

    db.prepare('UPDATE user_tokens SET tokens = tokens - 200 WHERE user_id = ?').run(req.userId);

    res.json({
      taskId,
      status: 'completed',
      result
    });
  } catch (error: any) {
    console.error('Document process error:', error);
    res.status(500).json({ error: error.message || '文档处理失败' });
  }
});

// Excel操作
router.post('/excel', authMiddleware, async (req: any, res: Response) => {
  try {
    const { instruction, data } = req.body;

    if (!instruction) {
      return res.status(400).json({ error: '指令必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < 200) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'excel_process', 'processing', JSON.stringify({ instruction }));

    const result = await zhipuService.processExcel(instruction, data);

    db.prepare(
      'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
    ).run('completed', JSON.stringify(result), taskId);

    db.prepare('UPDATE user_tokens SET tokens = tokens - 200 WHERE user_id = ?').run(req.userId);

    res.json({
      taskId,
      status: 'completed',
      result
    });
  } catch (error: any) {
    console.error('Excel process error:', error);
    res.status(500).json({ error: error.message || 'Excel处理失败' });
  }
});

// 视频生成
router.post('/video', authMiddleware, async (req: any, res: Response) => {
  try {
    const { prompt, duration } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '提示词必填' });
    }

    const db = getDatabase();
    const taskId = generateTaskId();

    const userTokens = db.prepare('SELECT tokens FROM user_tokens WHERE user_id = ?').get(req.userId) as any;
    if (!userTokens || userTokens.tokens < 1000) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(
      'INSERT INTO tasks (task_id, user_id, type, status, input) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, req.userId, 'video_generate', 'processing', JSON.stringify({ prompt }));

    try {
      const result = await zhipuService.generateVideo(prompt, duration || 5);

      db.prepare(
        'UPDATE tasks SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP WHERE task_id = ?'
      ).run('completed', JSON.stringify(result), taskId);

      db.prepare('UPDATE user_tokens SET tokens = tokens - 1000 WHERE user_id = ?').run(req.userId);

      res.json({
        taskId,
        status: 'completed',
        result
      });
    } catch (error: any) {
      // 视频生成功能可能暂未开放，返回友好提示
      db.prepare(
        'UPDATE tasks SET status = ? WHERE task_id = ?'
      ).run('failed', taskId);

      res.status(400).json({
        taskId,
        status: 'failed',
        error: '视频生成功能暂未开放，请稍后再试'
      });
    }
  } catch (error: any) {
    console.error('Video task error:', error);
    res.status(500).json({ error: error.message || '视频生成失败' });
  }
});

// 获取任务列表
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const db = getDatabase();
    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.userId, limit, offset);

    res.json({ tasks });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

// 获取单个任务
router.get('/:taskId', authMiddleware, async (req: any, res: Response) => {
  try {
    const db = getDatabase();
    const task = db.prepare(
      'SELECT * FROM tasks WHERE task_id = ? AND user_id = ?'
    ).get(req.params.taskId, req.userId);

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({ task });
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

export default router;
