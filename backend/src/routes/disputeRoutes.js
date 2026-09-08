import express from 'express';
import { create, getMy, getAll, resolve } from '../controllers/disputeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', create);
router.get('/my', getMy);
router.get('/', roleMiddleware('ADMIN'), getAll);
router.put('/:id/resolve', roleMiddleware('ADMIN'), resolve);

export default router;
