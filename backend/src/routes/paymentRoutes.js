import express from 'express';
import {
  processPaymentHandler,
  failPaymentHandler,
  createOrder,
  verify,
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected payment endpoints
router.post('/process', authMiddleware, processPaymentHandler);
router.post('/direct', authMiddleware, processPaymentHandler);
router.post('/fail', authMiddleware, failPaymentHandler);
router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verify);

export default router;
