import express from 'express';
import {
  getMy,
  getUnread,
  markOne,
  markAll,
} from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMy);
router.get('/unread-count', getUnread);
router.put('/:id/read', markOne);
router.put('/mark-all-read', markAll);

export default router;
