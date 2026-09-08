import { recommendHourlyPrice } from '../services/pricingService.js';
import { predictDemand } from '../services/demandService.js';
import { rankParkingSpaces } from '../services/recommendationService.js';
import { getHostInsights, dispatchSmartNotifications } from '../services/insightsService.js';
import ParkingSpace from '../models/ParkingSpace.js';

/**
 * Controller for AI and Smart Parking Features
 */

// POST /api/smart/pricing/recommend
export const getPriceRecommendation = async (req, res, next) => {
  try {
    const {
      city,
      lat,
      lng,
      parkingType,
      covered,
      cctv,
      evCharging,
      distanceFromPopularLocations,
      targetTime,
    } = req.body;

    const recommendation = await recommendHourlyPrice({
      city,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      parkingType,
      covered: Boolean(covered),
      cctv: Boolean(cctv),
      evCharging: Boolean(evCharging),
      distanceFromPopularLocations: distanceFromPopularLocations !== undefined ? Number(distanceFromPopularLocations) : undefined,
      targetTime: targetTime ? new Date(targetTime) : new Date(),
    });

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/smart/demand/forecast
export const getDemandForecast = async (req, res, next) => {
  try {
    const { city, lat, lng, targetTime, spotId } = req.query;

    const forecast = await predictDemand({
      city: city || 'Mumbai',
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      targetTime: targetTime ? new Date(targetTime) : new Date(),
      spotId,
    });

    res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/smart/recommendations
export const getSmartRecommendations = async (req, res, next) => {
  try {
    const { city, userLat, userLng, limit = 6 } = req.query;

    const filter = { status: 'active' };
    if (city) {
      filter.city = new RegExp(`^${city}$`, 'i');
    }

    const spaces = await ParkingSpace.find(filter)
      .populate('host', 'name email profileImage reliabilityScore isVerified')
      .limit(30);

    const ranked = rankParkingSpaces(spaces, {
      userLat: userLat ? Number(userLat) : undefined,
      userLng: userLng ? Number(userLng) : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        total: ranked.length,
        recommendations: ranked.slice(0, Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/smart/insights/host
export const getHostInsightsHandler = async (req, res, next) => {
  try {
    const insights = await getHostInsights(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/smart/advisories/evaluate
export const triggerSmartAdvisoriesHandler = async (req, res, next) => {
  try {
    const result = await dispatchSmartNotifications(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Smart advisory evaluation completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
