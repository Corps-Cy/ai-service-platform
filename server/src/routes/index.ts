import { Router } from 'express';
import authRoutes from './auth.js';
import taskRoutes from './tasks.js';
import paymentRoutes from './payment.js';
import userRoutes from './user.js';
import pricingRoutes from './pricing.js';
import adminRoutes from './admin.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/payment', paymentRoutes);
router.use('/user', userRoutes);
router.use('/pricing', pricingRoutes);
router.use('/admin', adminRoutes);

export default router;
