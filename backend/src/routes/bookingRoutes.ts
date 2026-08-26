import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { bookClass, cancelClassBooking, getMyBookings } from '../controllers/bookingController';

const router = Router();

router.get('/me', protect, getMyBookings);
router.post('/', protect, bookClass);
router.delete('/:classId', protect, cancelClassBooking);

export default router;
