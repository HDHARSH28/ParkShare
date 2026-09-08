import Favorite from '../models/Favorite.js';
import ParkingSpace from '../models/ParkingSpace.js';

/**
 * Toggle favorite on/off for a parking space
 */
export const toggleFavorite = async (userId, parkingSpaceId) => {
  const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
  if (!parkingSpace) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  const existing = await Favorite.findOne({ user: userId, parkingSpace: parkingSpaceId });

  if (existing) {
    await Favorite.findByIdAndDelete(existing._id);
    return {
      isFavorite: false,
      message: 'Removed from favorites',
      parkingSpaceId,
    };
  } else {
    await Favorite.create({ user: userId, parkingSpace: parkingSpaceId });
    return {
      isFavorite: true,
      message: 'Added to favorites ❤️',
      parkingSpaceId,
    };
  }
};

/**
 * Get all favorite parking spaces saved by a user
 */
export const getMyFavorites = async (userId) => {
  const favorites = await Favorite.find({ user: userId })
    .populate({
      path: 'parkingSpace',
      populate: { path: 'host', select: 'name email profileImage reliabilityScore isVerified' },
    })
    .sort('-createdAt');

  // Filter out any where parkingSpace might have been deleted
  const validFavorites = favorites
    .filter((f) => f.parkingSpace != null)
    .map((f) => ({
      _id: f._id,
      parkingSpace: f.parkingSpace,
      savedAt: f.createdAt,
    }));

  return validFavorites;
};

/**
 * Check if a parking space is favorited by current user
 */
export const checkIsFavorite = async (userId, parkingSpaceId) => {
  const count = await Favorite.countDocuments({ user: userId, parkingSpace: parkingSpaceId });
  return { isFavorite: count > 0 };
};
