import { Router } from 'express';
import authRoutes from './authRoutes';
import classRoutes from './classRoutes';
import bookingRoutes from './bookingRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/bookings', bookingRoutes);

export default router;
