import { Router, Request, Response } from 'express';
import { getDatabase } from '../models/database.js';

const router = Router();

// 获取所有定价
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const pricing = db.prepare('SELECT * FROM pricing WHERE is_active = 1').all();

    res.json({ pricing });
  } catch (error: any) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: '获取定价失败' });
  }
});

// 获取所有套餐
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1').all();

    // 解析features JSON
    const parsedPlans = plans.map((plan: any) => ({
      ...plan,
      features: JSON.parse(plan.features)
    }));

    res.json({ plans: parsedPlans });
  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: '获取套餐失败' });
  }
});

// 获取单个套餐
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id) as any;

    if (!plan) {
      return res.status(404).json({ error: '套餐不存在' });
    }

    res.json({
      plan: {
        ...plan,
        features: JSON.parse(plan.features)
      }
    });
  } catch (error: any) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: '获取套餐失败' });
  }
});

export default router;
