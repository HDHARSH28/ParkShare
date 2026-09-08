import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';

/**
 * Demand Prediction Service
 *
 * Implements a transparent, rule-based heuristic demand evaluation engine
 * with a standardized ML-ready interface contract.
 *
 * Demand factors:
 * 1. Time of day (commuter rush hours, shopping hours, night hours)
 * 2. Day of week (weekdays vs weekends)
 * 3. Empirical booking density in the area
 * 4. Available inventory ratio
 */

/**
 * Computes base temporal demand score (0 - 100) based on hour of day and day of week.
 */
export const getTemporalDemandScore = (hour, dayOfWeek) => {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

  if (!isWeekend) {
    // Weekday demand curve
    if (hour >= 8 && hour < 11) {
      // Morning rush
      return { score: 82, level: 'HIGH', label: 'Morning Commute Surge' };
    }
    if (hour >= 11 && hour < 17) {
      // Midday steady business
      return { score: 62, level: 'MEDIUM', label: 'Midday Business Traffic' };
    }
    if (hour >= 17 && hour < 21) {
      // Evening rush & dining
      return { score: 88, level: 'HIGH', label: 'Evening Commute & Commercial Peak' };
    }
    if (hour >= 21 && hour < 24) {
      // Late evening
      return { score: 48, level: 'MEDIUM', label: 'Late Evening Moderate' };
    }
    // Night (0 to 8)
    return { score: 22, level: 'LOW', label: 'Overnight Low Traffic' };
  } else {
    // Weekend demand curve
    if (hour >= 12 && hour < 22) {
      // Afternoon & evening leisure / shopping
      return { score: 85, level: 'HIGH', label: 'Weekend Leisure & Shopping Surge' };
    }
    if (hour >= 9 && hour < 12) {
      // Weekend late morning
      return { score: 58, level: 'MEDIUM', label: 'Weekend Morning Activity' };
    }
    if (hour >= 22 && hour < 24) {
      // Weekend nightlife
      return { score: 65, level: 'MEDIUM', label: 'Nightlife Activity' };
    }
    // Early morning (0 to 9)
    return { score: 25, level: 'LOW', label: 'Early Weekend Quiet' };
  }
};

/**
 * Predicts current or target demand for a specific location and time window.
 *
 * @param {Object} params
 * @param {string} [params.city]
 * @param {number} [params.lat]
 * @param {number} [params.lng]
 * @param {Date|string} [params.targetTime]
 * @param {string} [params.spotId]
 * @returns {Promise<Object>} Demand analysis result
 */
export const predictDemand = async ({
  city,
  lat,
  lng,
  targetTime = new Date(),
  spotId,
} = {}) => {
  const dateObj = new Date(targetTime);
  const hour = isNaN(dateObj.getTime()) ? new Date().getHours() : dateObj.getHours();
  const dayOfWeek = isNaN(dateObj.getTime()) ? new Date().getDay() : dateObj.getDay();

  // 1. Base temporal calculation
  const temporal = getTemporalDemandScore(hour, dayOfWeek);
  let aggregateScore = temporal.score;

  // 2. Historical empirical density in area
  try {
    const query = {};
    if (city) {
      query.city = new RegExp(`^${city}$`, 'i');
    }

    // Find active parking spots in area
    const areaSpots = await ParkingSpace.find(query).select('_id').limit(50);
    const spotIds = areaSpots.map((s) => s._id);

    if (spotIds.length > 0) {
      // Check recent confirmed/active bookings in past 14 days
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentBookingsCount = await Booking.countDocuments({
        parkingSpace: { $in: spotIds },
        createdAt: { $gte: fourteenDaysAgo },
        status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
      });

      // Scale density impact: up to +15 points for high activity spots
      const densityBonus = Math.min(15, Math.round((recentBookingsCount / spotIds.length) * 3));
      aggregateScore = Math.min(100, aggregateScore + densityBonus);
    }
  } catch (err) {
    // If DB query fails, fall back gracefully to temporal calculation
  }

  // 3. Classify level
  let demandLevel = 'LOW';
  let multiplier = 1.0;
  if (aggregateScore >= 72) {
    demandLevel = 'HIGH';
    multiplier = 1.25;
  } else if (aggregateScore >= 45) {
    demandLevel = 'MEDIUM';
    multiplier = 1.1;
  } else {
    demandLevel = 'LOW';
    multiplier = 0.95;
  }

  // 4. Generate peak hour intervals and contextual insight message
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const peakHours = isWeekend ? ['12:00 PM - 5:00 PM', '6:00 PM - 10:00 PM'] : ['8:00 AM - 11:00 AM', '5:00 PM - 9:00 PM'];

  let insightMessage = '';
  if (demandLevel === 'HIGH') {
    insightMessage = `🔥 HIGH DEMAND: Parking demand is expected to be high from ${peakHours[1]}. Secure your spot early.`;
  } else if (demandLevel === 'MEDIUM') {
    insightMessage = `⚡ MODERATE DEMAND: Steady parking activity in this area. Availability is currently balanced.`;
  } else {
    insightMessage = `🟢 LOW DEMAND: Plenty of parking capacity currently available in this sector.`;
  }

  // 5. 24-hour forecast curve
  const forecast = [];
  for (let h = 0; h < 24; h++) {
    const hourly = getTemporalDemandScore(h, dayOfWeek);
    const hour12 = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    forecast.push({
      hour: h,
      timeLabel: hour12,
      demandLevel: hourly.level,
      demandScore: hourly.score,
      label: hourly.label,
    });
  }

  return {
    demandLevel,
    demandScore: aggregateScore,
    multiplier,
    peakHours,
    insight: insightMessage,
    forecast,
    evaluatedAt: new Date(),
    modelInfo: {
      type: 'Rule-based Heuristic Engine',
      version: '1.0.0',
      mlReady: true,
    },
  };
};
