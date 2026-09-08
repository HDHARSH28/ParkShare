import ParkingSpace from '../models/ParkingSpace.js';
import User from '../models/User.js';
import { rankParkingSpaces } from './recommendationService.js';

/**
 * Create a new parking space
 */
export const createParkingSpace = async (hostId, data) => {
  // Only approved hosts can publish active parking spaces
  if (data.status === 'active') {
    const host = await User.findById(hostId);
    if (!host?.isVerified) {
      const error = new Error(
        'Host verification required. Only approved and verified hosts can publish active parking spaces. Please submit your verification under /verification.'
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const parking = await ParkingSpace.create({
    ...data,
    host: hostId,
  });
  return parking;
};

/**
 * Get all parking spaces with search, filter, sort, pagination
 */
export const getAllParkingSpaces = async (query = {}) => {
  const {
    search,
    parkingType,
    vehicleType,
    minPrice,
    maxPrice,
    covered,
    cctv,
    evCharging,
    sort = '-createdAt',
    page = 1,
    limit = 12,
    userLat,
    userLng,
  } = query;

  const filter = { status: 'active' };

  // Text search across title, description, address, city
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  if (parkingType) {
    filter.parkingType = parkingType;
  }

  if (vehicleType) {
    filter.vehicleTypes = { $in: vehicleType.split(',') };
  }

  // Price filter — check against pricePerHour
  if (minPrice || maxPrice) {
    filter.pricePerHour = {};
    if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
  }

  if (covered === 'true') filter.covered = true;
  if (cctv === 'true') filter.cctv = true;
  if (evCharging === 'true') filter.evCharging = true;

  const skip = (Number(page) - 1) * Number(limit);

  const dbSort = sort === 'recommended' ? '-createdAt' : sort;

  const [rawParkingSpaces, total] = await Promise.all([
    ParkingSpace.find(filter)
      .populate('host', 'name email profileImage reliabilityScore isVerified')
      .sort(dbSort)
      .skip(skip)
      .limit(Number(limit)),
    ParkingSpace.countDocuments(filter),
  ]);

  // Score with Smart Recommendation Engine
  let parkingSpaces = rankParkingSpaces(rawParkingSpaces, {
    userLat: userLat ? Number(userLat) : undefined,
    userLng: userLng ? Number(userLng) : undefined,
  });

  if (sort === 'distance') {
    parkingSpaces.sort((a, b) => {
      const distA = a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : 999999;
      const distB = b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : 999999;
      return distA - distB;
    });
  } else if (sort === 'recommended') {
    // rankParkingSpaces already sorts descending by recommendationScore
  } else if (sort !== 'recommended' && dbSort) {
    // keep DB sort order if user explicitly sorted by price or date
    const idOrder = new Map(rawParkingSpaces.map((s, idx) => [s._id.toString(), idx]));
    parkingSpaces.sort((a, b) => idOrder.get(a._id.toString()) - idOrder.get(b._id.toString()));
  }

  return {
    parkingSpaces,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get parking space by ID
 */
export const getParkingSpaceById = async (id) => {
  const parking = await ParkingSpace.findById(id).populate(
    'host',
    'name email phone profileImage reliabilityScore isVerified'
  );

  if (!parking) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  return parking;
};

/**
 * Update a parking space (only by owner)
 */
export const updateParkingSpace = async (id, hostId, data) => {
  const parking = await ParkingSpace.findById(id);

  if (!parking) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  if (parking.host.toString() !== hostId.toString()) {
    const error = new Error('Not authorized — you can only edit your own listings');
    error.statusCode = 403;
    throw error;
  }

  // Only approved verified hosts can publish listings to active
  if (data.status === 'active' && parking.status !== 'active') {
    const host = await User.findById(hostId);
    if (!host?.isVerified) {
      const error = new Error(
        'Host verification required. Only approved and verified hosts can publish active parking spaces. Please submit your verification under /verification.'
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Update fields
  Object.assign(parking, data);
  await parking.save();

  return parking;
};

/**
 * Delete a parking space (only by owner)
 */
export const deleteParkingSpace = async (id, hostId) => {
  const parking = await ParkingSpace.findById(id);

  if (!parking) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  if (parking.host.toString() !== hostId.toString()) {
    const error = new Error('Not authorized — you can only delete your own listings');
    error.statusCode = 403;
    throw error;
  }

  await ParkingSpace.findByIdAndDelete(id);
  return parking;
};

/**
 * Get all parking spaces owned by a host
 */
export const getMyListings = async (hostId) => {
  const parkingSpaces = await ParkingSpace.find({ host: hostId })
    .sort('-createdAt');
  return parkingSpaces;
};

/**
 * Activate "I'm Leaving Home" mode for a spot
 */
export const setLeavingHomeSchedule = async (id, hostId, { date, startTime, endTime }) => {
  const parking = await ParkingSpace.findById(id);

  if (!parking) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  if (parking.host.toString() !== hostId.toString()) {
    const error = new Error('Not authorized — you can only configure your own listings');
    error.statusCode = 403;
    throw error;
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  // Deactivate any existing schedule for the same date
  if (!parking.leavingHomeSchedule) {
    parking.leavingHomeSchedule = [];
  }
  parking.leavingHomeSchedule.forEach((s) => {
    if (s.date === targetDate) {
      s.isActive = false;
    }
  });

  // Push new schedule entry
  parking.leavingHomeSchedule.push({
    date: targetDate,
    startTime: startTime || '09:00',
    endTime: endTime || '18:00',
    isActive: true,
  });

  // Automatically ensure status is active
  parking.status = 'active';
  await parking.save();

  return parking;
};

/**
 * Get nearby parking spaces using MongoDB 2dsphere $near query
 */
export const getNearbyParkingSpaces = async ({
  lat,
  lng,
  maxDistanceKm = 15,
  limit = 20,
}) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    const error = new Error('Valid lat and lng query parameters are required');
    error.statusCode = 400;
    throw error;
  }

  const maxDistanceMeters = Number(maxDistanceKm) * 1000;

  const spaces = await ParkingSpace.find({
    status: 'active',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  })
    .populate('host', 'name email profileImage reliabilityScore isVerified')
    .limit(Number(limit));

  return rankParkingSpaces(spaces, { userLat: latitude, userLng: longitude });
};

