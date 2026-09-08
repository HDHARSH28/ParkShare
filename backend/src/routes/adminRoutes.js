import express from 'express';
import {
  getDashboardStatsHandler,
  getUsersListHandler,
  getUserDetailsHandler,
  toggleUserBlockHandler,
  getHostsListHandler,
  getAdminListingsHandler,
  updateListingStatusHandler,
  deleteListingByAdminHandler,
  getAdminBookingsHandler,
  getAdminPaymentsHandler,
  getAnalyticsDataHandler,
  getAdminReviewsHandler,
  deleteReviewByAdminHandler,
} from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Strict Admin Security: All routes below require valid JWT token AND ADMIN role
router.use(authMiddleware, roleMiddleware('ADMIN'));

// Platform Overview Stats
router.get('/stats', getDashboardStatsHandler);

// User Management
router.get('/users', getUsersListHandler);
router.get('/users/:id', getUserDetailsHandler);
router.put('/users/:id/block', toggleUserBlockHandler);

// Host Management
router.get('/hosts', getHostsListHandler);

// Parking Listings Management
router.get('/parking', getAdminListingsHandler);
router.put('/parking/:id/status', updateListingStatusHandler);
router.delete('/parking/:id', deleteListingByAdminHandler);

// Booking Management
router.get('/bookings', getAdminBookingsHandler);

// Payment Management
router.get('/payments', getAdminPaymentsHandler);

// Review Management
router.get('/reviews', getAdminReviewsHandler);
router.delete('/reviews/:id', deleteReviewByAdminHandler);

// Analytics
router.get('/analytics', getAnalyticsDataHandler);

export default router;
