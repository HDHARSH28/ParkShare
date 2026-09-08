import Vehicle from '../models/Vehicle.js';

export const createVehicle = async (ownerId, data) => {
  const vehicle = await Vehicle.create({
    ...data,
    owner: ownerId,
  });
  return vehicle;
};

export const getMyVehicles = async (ownerId) => {
  const vehicles = await Vehicle.find({ owner: ownerId }).sort('-createdAt');
  return vehicles;
};

export const getVehicleById = async (vehicleId, ownerId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: ownerId });
  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }
  return vehicle;
};

export const updateVehicle = async (vehicleId, ownerId, data) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: ownerId });
  if (!vehicle) {
    const error = new Error('Vehicle not found or not authorized to edit');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(vehicle, data);
  await vehicle.save();
  return vehicle;
};

export const deleteVehicle = async (vehicleId, ownerId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: ownerId });
  if (!vehicle) {
    const error = new Error('Vehicle not found or not authorized to delete');
    error.statusCode = 404;
    throw error;
  }

  await Vehicle.findByIdAndDelete(vehicleId);
  return vehicle;
};
