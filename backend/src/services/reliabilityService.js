import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import User from '../models/User.js';

/**
 * Calculate and update a host's dynamic reliability score
 * Factors: Completed bookings, Cancellations, Disputes, No-shows/Expired
 */
export const calculateHostReliability = async (hostId) => {
  try {
    const [completedCount, cancelledCount, disputeCount, noShowCount] = await Promise.all([
      Booking.countDocuments({ host: hostId, status: 'COMPLETED' }),
      Booking.countDocuments({ host: hostId, status: 'CANCELLED' }),
      Dispute.countDocuments({ host: hostId, status: { $in: ['RESOLVED', 'OPEN', 'UNDER_REVIEW'] } }),
      Booking.countDocuments({ host: hostId, status: 'EXPIRED' }),
    ]);

    const totalOpportunities = completedCount + cancelledCount + disputeCount + noShowCount;

    let score = 100;
    if (totalOpportunities > 0) {
      // Weighted denominator
      const weightedDenominator =
        completedCount + cancelledCount * 1.5 + disputeCount * 2.0 + noShowCount * 1.5;

      if (weightedDenominator > 0) {
        const ratio = completedCount / weightedDenominator;
        score = Math.max(10, Math.min(100, Math.round(ratio * 100)));
      }
    }

    // Save updated score to user record
    await User.findByIdAndUpdate(hostId, { reliabilityScore: score });

    return {
      score,
      breakdown: {
        completedCount,
        cancelledCount,
        disputeCount,
        noShowCount,
        totalOpportunities,
      },
    };
  } catch (err) {
    console.error('Error calculating host reliability score:', err);
    return { score: 100, breakdown: {} };
  }
};
