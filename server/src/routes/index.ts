import { Router } from 'express';
import authRoutes from './auth.js';
import taskRoutes from './tasks.js';
import paymentRoutes from './payment.js';
import userRoutes from './user.js';
import pricingRoutes from './pricing.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/payment', paymentRoutes);
router.use('/user', userRoutes);
router.use('/pricing', pricingRoutes);

export default router;
