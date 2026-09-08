import express from 'express';
import { create, getByParking, getByHost, getMy } from '../controllers/reviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public review lookups
router.get('/parking/:parkingId', getByParking);
router.get('/host/:hostId', getByHost);

// Protected routes
router.post('/', authMiddleware, create);
router.get('/my', authMiddleware, getMy);

export default router;
