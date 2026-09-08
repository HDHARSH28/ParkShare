import express from 'express';
import { toggle, getMy, check } from '../controllers/favoriteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMy);
router.post('/:parkingId/toggle', toggle);
router.get('/:parkingId/check', check);

export default router;
