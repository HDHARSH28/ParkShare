import ParkingSpace from '../models/ParkingSpace.js';
import { predictDemand } from './demandService.js';

/**
 * Reusable pricing calculation service
 *
 * Base Price: based on spot hourly and daily rates
 * Platform Fee: 10% of base price (minimum ₹10)
 * Tax: 18% GST on platform fee
 * Total Amount = Base Price + Platform Fee + Tax
 */
export const calculateBookingPrice = ({
  pricePerHour = 0,
  pricePerDay = 0,
  startTime,
  endTime,
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end time format');
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    throw new Error('End time must be strictly after start time');
  }

  // Calculate actual hours
  const rawHours = diffMs / (1000 * 60 * 60);
  const durationHours = Math.round(rawHours * 100) / 100;

  // Minimum billed duration: 1 hour, fractional hours rounded up to half hour or nearest integer
  const billedHours = Math.max(1, Math.ceil(durationHours * 2) / 2);

  let basePrice = 0;
  if (billedHours >= 24 && pricePerDay > 0) {
    const fullDays = Math.floor(billedHours / 24);
    const remainderHours = billedHours % 24;
    basePrice = fullDays * pricePerDay + remainderHours * pricePerHour;
  } else {
    basePrice = billedHours * pricePerHour;
  }

  basePrice = Math.round(basePrice * 100) / 100;

  // Platform Fee: 10% of basePrice, minimum ₹10
  const platformFee = Math.max(10, Math.round(basePrice * 0.1 * 100) / 100);

  // Tax: 18% GST on platform fee
  const tax = Math.round(platformFee * 0.18 * 100) / 100;

  // Total
  const totalAmount = Math.round((basePrice + platformFee + tax) * 100) / 100;

  return {
    durationHours,
    billedHours,
    basePrice,
    platformFee,
    tax,
    totalAmount,
  };
};

/**
 * Smart Price Recommendation Engine
 *
 * Transparent rule-based pricing optimization algorithm designed with an ML-ready contract.
 * Factors:
 * - Base parking type baseline
 * - Covered/open protection premium
 * - Real local market prices (nearby median in database)
 * - Proximity to central/popular commercial points
 * - Real-time and forecasted demand surge
 */

export const recommendHourlyPrice = async ({
  city = 'Mumbai',
  lat,
  lng,
  parkingType = 'Garage',
  covered = false,
  cctv = false,
  evCharging = false,
  distanceFromPopularLocations, // in km, optional
  targetTime = new Date(),
} = {}) => {
  // 1. Base price by parking type
  const baseTypeRates = {
    'Commercial': 55,
    'Garage': 45,
    'Apartment': 35,
    'Society': 35,
    'Home Driveway': 30,
    'Private Plot': 25,
  };
  const typeBase = baseTypeRates[parkingType] || 35;

  // 2. Fetch nearby market prices from DB
  let marketAvg = typeBase;
  let nearbyCount = 0;
  try {
    const filter = { status: 'active' };
    if (city) {
      filter.city = new RegExp(`^${city}$`, 'i');
    }
    const nearbySpaces = await ParkingSpace.find(filter).select('pricePerHour parkingType').limit(25);
    if (nearbySpaces.length > 0) {
      nearbyCount = nearbySpaces.length;
      const prices = nearbySpaces.map((s) => s.pricePerHour).filter((p) => p > 0);
      if (prices.length > 0) {
        marketAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    }
  } catch (err) {
    // fallback to typeBase
  }

  // Blended baseline: 50% property type intrinsic baseline, 50% local market average
  let runningPrice = 0.5 * typeBase + 0.5 * marketAvg;

  // 3. Amenity adjustments
  const amenityBonus = [];
  if (covered) {
    runningPrice += 6;
    amenityBonus.push('Covered protection (+₹6)');
  }
  if (cctv) {
    runningPrice += 3;
    amenityBonus.push('CCTV surveillance (+₹3)');
  }
  if (evCharging) {
    runningPrice += 8;
    amenityBonus.push('EV charging facility (+₹8)');
  }

  // 4. Distance factor from popular hubs (or default estimation)
  let distanceAdjustment = 0;
  const effectiveDistance = distanceFromPopularLocations !== undefined ? distanceFromPopularLocations : 1.5;
  if (effectiveDistance <= 1.0) {
    distanceAdjustment = 8;
  } else if (effectiveDistance <= 3.0) {
    distanceAdjustment = 4;
  } else if (effectiveDistance > 8.0) {
    distanceAdjustment = -5;
  }
  runningPrice += distanceAdjustment;

  // 5. Dynamic demand prediction
  const demandResult = await predictDemand({ city, lat, lng, targetTime });
  const demandMultiplier = demandResult.multiplier || 1.0;
  runningPrice = runningPrice * demandMultiplier;

  // 6. Rounding to user-friendly round step (multiples of 5)
  const recommended = Math.max(15, Math.round(runningPrice / 5) * 5);
  const minPrice = Math.max(10, Math.round((recommended * 0.75) / 5) * 5);
  const maxPrice = Math.round((recommended * 1.35) / 5) * 5;

  // 7. Human-readable explainable rationale
  let reason = '';
  if (demandResult.demandLevel === 'HIGH' && effectiveDistance <= 2.5) {
    reason = 'High demand and close to a popular location.';
  } else if (demandResult.demandLevel === 'HIGH') {
    reason = 'High localized demand during peak hours in this area.';
  } else if (covered && effectiveDistance <= 2.0) {
    reason = 'Premium covered parking near key destinations.';
  } else if (effectiveDistance <= 1.0) {
    reason = 'Prime central location with high footfall and vehicle traffic.';
  } else if (demandResult.demandLevel === 'LOW') {
    reason = 'Competitive baseline pricing optimized for high occupancy during off-peak windows.';
  } else {
    reason = 'Balanced market pricing aligned with nearby active listings.';
  }

  return {
    recommendedPricePerHour: recommended,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      recommended,
    },
    reason,
    breakdown: {
      propertyTypeBase: typeBase,
      marketAverageNearby: Math.round(marketAvg),
      nearbyCompetitorCount: nearbyCount,
      amenityBonus,
      distanceAdjustment,
      demandLevel: demandResult.demandLevel,
      demandMultiplier,
    },
    demandInfo: {
      demandLevel: demandResult.demandLevel,
      demandScore: demandResult.demandScore,
      peakHours: demandResult.peakHours,
      insight: demandResult.insight,
    },
    modelInfo: {
      type: 'Rule-based Smart Pricing Engine',
      version: '1.0.0',
      mlReady: true,
    },
  };
};
