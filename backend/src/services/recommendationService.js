/**
 * Smart Parking Recommendation Engine
 *
 * Evaluates and scores parking spaces using a multi-factor weighted ranking heuristic.
 * ML-ready modular architecture: can be swapped with a collaborative filtering or
 * learned ranking model (e.g. XGBoost / RankNet) in the future.
 *
 * Weight Distribution:
 * - Distance Proximity: 30%
 * - Price Competitiveness: 25%
 * - Rating & Host Trust: 25%
 * - Security & Amenities: 10%
 * - Availability & Status: 10%
 */

/**
 * Calculates Haversine distance in kilometers between two coordinate pairs.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Scores a single parking space against search criteria.
 */
export const scoreParkingSpace = (space, criteria = {}) => {
  const { userLat, userLng } = criteria;
  const reasons = [];

  // 1. Distance Proximity (0 - 30)
  let distanceScore = 20; // Default when no location supplied
  let distanceKm = null;
  if (userLat && userLng && space.latitude && space.longitude) {
    distanceKm = calculateDistanceKm(userLat, userLng, space.latitude, space.longitude);
    if (distanceKm <= 0.5) {
      distanceScore = 30;
      reasons.push(`Super close (${distanceKm} km away)`);
    } else if (distanceKm <= 1.0) {
      distanceScore = 27;
      reasons.push(`Under 1 km (${distanceKm} km)`);
    } else if (distanceKm <= 2.5) {
      distanceScore = 22;
      reasons.push(`Nearby (${distanceKm} km)`);
    } else if (distanceKm <= 5.0) {
      distanceScore = 16;
    } else if (distanceKm <= 10.0) {
      distanceScore = 10;
    } else {
      distanceScore = 5;
    }
  }

  // 2. Price Competitiveness (0 - 25)
  let priceScore = 15;
  const price = space.pricePerHour || 40;
  if (price <= 25) {
    priceScore = 25;
    reasons.push(`Great value rate (₹${price}/hr)`);
  } else if (price <= 35) {
    priceScore = 22;
    reasons.push(`Competitive rate (₹${price}/hr)`);
  } else if (price <= 50) {
    priceScore = 18;
  } else if (price <= 75) {
    priceScore = 13;
  } else {
    priceScore = 8;
  }

  // 3. Rating & Host Trust (0 - 25)
  const ratingVal = space.rating || 4.5;
  const starScore = Math.min(15, (ratingVal / 5) * 15);

  let hostTrustScore = 0;
  const host = space.host || {};
  if (host.isVerified) {
    hostTrustScore += 5;
    reasons.push('Verified Host');
  }
  const reliability = host.reliabilityScore || 95;
  hostTrustScore += Math.min(5, (reliability / 100) * 5);

  if (ratingVal >= 4.7) {
    reasons.push(`Top-rated (⭐ ${ratingVal})`);
  }

  const ratingScore = Math.round(starScore + hostTrustScore);

  // 4. Security & Amenities (0 - 10)
  let securityScore = 0;
  const amenities = [];
  if (space.covered) {
    securityScore += 3;
    amenities.push('Covered');
  }
  if (space.cctv) {
    securityScore += 3;
    amenities.push('CCTV');
  }
  if (space.gateAccess) {
    securityScore += 2;
    amenities.push('Gated');
  }
  if (space.security) {
    securityScore += 2;
    amenities.push('Guarded');
  }
  if (amenities.length >= 2) {
    reasons.push(`Secure (${amenities.join(', ')})`);
  }

  // 5. Availability & Status (0 - 10)
  let availabilityScore = space.status === 'active' ? 5 : 0;
  if (space.availability?.days?.length > 0) {
    availabilityScore += 5;
  }

  // Total Score out of 100
  const rawTotal = distanceScore + priceScore + ratingScore + securityScore + availabilityScore;
  const totalScore = Math.min(99, Math.max(20, Math.round(rawTotal)));

  // Determine Match Tag
  let matchTag = null;
  if (totalScore >= 88) {
    matchTag = 'Top Match';
  } else if (price <= 30 && totalScore >= 75) {
    matchTag = 'Best Value';
  } else if (securityScore >= 7) {
    matchTag = 'Top Security';
  } else if (distanceKm !== null && distanceKm <= 1.0) {
    matchTag = 'Closest Spot';
  }

  return {
    recommendationScore: totalScore,
    matchTag,
    matchReasons: reasons.slice(0, 3), // Top 3 highlights
    distanceKm,
    factors: {
      distanceScore,
      priceScore,
      ratingScore,
      securityScore,
      availabilityScore,
    },
  };
};

/**
 * Ranks an array of parking space documents according to recommendation score.
 *
 * @param {Array} parkingSpaces
 * @param {Object} criteria
 * @returns {Array} Sorted and scored parking spaces
 */
export const rankParkingSpaces = (parkingSpaces = [], criteria = {}) => {
  const scored = parkingSpaces.map((space) => {
    // Convert to plain object if Mongoose document
    const spaceObj = space.toObject ? space.toObject() : { ...space };
    const scoreResult = scoreParkingSpace(spaceObj, criteria);
    return {
      ...spaceObj,
      recommendationScore: scoreResult.recommendationScore,
      matchTag: scoreResult.matchTag,
      matchReasons: scoreResult.matchReasons,
      distanceKm: scoreResult.distanceKm,
      scoreFactors: scoreResult.factors,
    };
  });

  // Sort descending by recommendationScore
  return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
};
