import express from 'express';
import { submit, getMy, getAll, review } from '../controllers/verificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware('HOST', 'ADMIN'), submit);
router.get('/me', authMiddleware, getMy);
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getAll);
router.put('/:id/review', authMiddleware, roleMiddleware('ADMIN'), review);

export default router;
