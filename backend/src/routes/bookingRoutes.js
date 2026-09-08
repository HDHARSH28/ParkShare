import express from 'express';
import {
  makeBooking,
  myBookings,
  hostBookings,
  getBooking,
  cancel,
  availability,
  calculateQuote,
  checkIn,
  checkOut,
} from '../controllers/bookingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes for quotes and availability calendar
router.get('/availability/:parkingId', availability);
router.post('/quote', calculateQuote);

// Protected routes (must be authenticated)
router.post('/', authMiddleware, makeBooking);
router.get('/my', authMiddleware, myBookings);
router.get('/host', authMiddleware, roleMiddleware('HOST', 'ADMIN'), hostBookings);
router.post('/check-in', authMiddleware, roleMiddleware('HOST', 'ADMIN'), checkIn);
router.post('/check-out', authMiddleware, roleMiddleware('HOST', 'ADMIN'), checkOut);
router.get('/:id', authMiddleware, getBooking);
router.put('/:id/cancel', authMiddleware, cancel);

export default router;
