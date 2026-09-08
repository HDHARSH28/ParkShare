import express from 'express';
import {
  createParking,
  getAllParking,
  getParkingById,
  updateParking,
  deleteParking,
  myListings,
  leavingHome,
  getNearbyParking,
} from '../controllers/parkingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Host-only routes (must come before /:id to avoid route collision)
router.get('/my-listings', authMiddleware, roleMiddleware('HOST'), myListings);
router.post('/', authMiddleware, roleMiddleware('HOST'), createParking);
router.post('/:id/leaving-home', authMiddleware, roleMiddleware('HOST'), leavingHome);

// Public routes
router.get('/', getAllParking);
router.get('/nearby', getNearbyParking);
router.get('/:id', getParkingById);

// Host-only (owner) routes
router.put('/:id', authMiddleware, roleMiddleware('HOST'), updateParking);
router.delete('/:id', authMiddleware, roleMiddleware('HOST'), deleteParking);

export default router;
