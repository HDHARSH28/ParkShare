import express from 'express';
import {
  getPriceRecommendation,
  getDemandForecast,
  getSmartRecommendations,
  getHostInsightsHandler,
  triggerSmartAdvisoriesHandler,
} from '../controllers/smartController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Pricing recommendation
router.post('/pricing/recommend', getPriceRecommendation);

// Demand prediction & forecast curve
router.get('/demand/forecast', getDemandForecast);

// Smart ranked recommendations
router.get('/recommendations', getSmartRecommendations);

// Host insights & performance analytics (Protected for Hosts & Admins)
router.get('/insights/host', authMiddleware, roleMiddleware('HOST', 'ADMIN'), getHostInsightsHandler);

// Trigger smart advisory evaluation and notifications
router.post('/advisories/evaluate', authMiddleware, roleMiddleware('HOST', 'ADMIN'), triggerSmartAdvisoriesHandler);

export default router;
