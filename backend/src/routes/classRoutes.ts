import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { cancelInstructorClass, createInstructorClass, getClasses, getInstructorClassMembers, updateInstructorClass } from '../controllers/classController';

const router = Router();

router.get('/', protect, getClasses);
router.post('/', protect, createInstructorClass);
router.patch('/:classId', protect, updateInstructorClass);
router.post('/:classId/cancel', protect, cancelInstructorClass);
router.get('/:classId/members', protect, getInstructorClassMembers);

export default router;
