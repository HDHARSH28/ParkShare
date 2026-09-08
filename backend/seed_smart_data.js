import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import ParkingSpace from './src/models/ParkingSpace.js';
import Booking from './src/models/Booking.js';
import Vehicle from './src/models/Vehicle.js';
import Review from './src/models/Review.js';

dotenv.config();

const seedSmartData = async () => {
  console.log('--- SEEDING SAMPLE DATA FOR AI & SMART PARKING FEATURES ---');
  await connectDB();

  // 1. Get or Create Host and Driver
  let host = await User.findOne({ email: 'host@test.com' });
  if (!host) {
    host = await User.create({
      name: 'Priya Sharma (Host)',
      email: 'host@test.com',
      password: 'password123',
      phone: '+919876543210',
      role: 'HOST',
      isVerified: true,
      reliabilityScore: 96,
    });
  } else {
    host.isVerified = true;
    host.reliabilityScore = 96;
    await host.save();
  }

  let driver = await User.findOne({ email: 'driver@test.com' });
  if (!driver) {
    driver = await User.create({
      name: 'Rahul Verma (Driver)',
      email: 'driver@test.com',
      password: 'password123',
      phone: '+919811122233',
      role: 'DRIVER',
    });
  }

  // 2. Ensure Vehicle
  let vehicle = await Vehicle.findOne({ owner: driver._id });
  if (!vehicle) {
    vehicle = await Vehicle.create({
      owner: driver._id,
      vehicleNumber: 'MH 02 CZ 4567',
      vehicleType: 'Sedan',
      model: 'Honda City',
      color: 'Silver',
    });
  }

  // 3. Create or Update Sample Parking Spaces
  const sampleSpots = [
    {
      host: host._id,
      title: 'Bandra West Covered Driveway Spot',
      description: 'Private secure covered parking in prime Bandra West, 2 mins from Hill Road.',
      address: '24 Hill Road, Bandra West',
      city: 'Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      parkingType: 'Home Driveway',
      vehicleTypes: ['Sedan', 'Hatchback', 'SUV', 'EV'],
      covered: true,
      cctv: true,
      gateAccess: true,
      security: true,
      evCharging: false,
      pricePerHour: 40,
      pricePerDay: 450,
      pricePerMonth: 8500,
      status: 'active',
      rating: 4.9,
      totalReviews: 8,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '08:00',
        endTime: '22:00',
      },
    },
    {
      host: host._id,
      title: 'BKC Business Commercial Garage',
      description: 'High-security underground garage spot directly opposite Jio World Centre.',
      address: 'G Block, Bandra Kurla Complex',
      city: 'Mumbai',
      latitude: 19.0662,
      longitude: 72.8687,
      parkingType: 'Commercial',
      vehicleTypes: ['Sedan', 'SUV', 'EV'],
      covered: true,
      cctv: true,
      gateAccess: true,
      security: true,
      evCharging: true,
      pricePerHour: 60,
      pricePerDay: 650,
      pricePerMonth: 12000,
      status: 'active',
      rating: 4.8,
      totalReviews: 12,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '07:00',
        endTime: '23:00',
      },
    },
    {
      host: host._id,
      title: 'Andheri East Budget Parking Lot',
      description: 'Gated open lot convenient for Western Express Highway commuters.',
      address: 'Near Metro Station, Andheri East',
      city: 'Mumbai',
      latitude: 19.1197,
      longitude: 72.8464,
      parkingType: 'Private Plot',
      vehicleTypes: ['Hatchback', 'Sedan', 'Bike', 'Scooter'],
      covered: false,
      cctv: true,
      gateAccess: true,
      security: false,
      evCharging: false,
      pricePerHour: 30,
      pricePerDay: 300,
      pricePerMonth: 6000,
      status: 'active',
      rating: 4.6,
      totalReviews: 5,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '06:00',
        endTime: '21:00',
      },
    },
  ];

  const createdSpots = [];
  for (const s of sampleSpots) {
    let spot = await ParkingSpace.findOne({ title: s.title });
    if (!spot) {
      spot = await ParkingSpace.create(s);
    } else {
      Object.assign(spot, s);
      await spot.save();
    }
    createdSpots.push(spot);
  }

  console.log(`Created/Verified ${createdSpots.length} parking spaces.`);

  // 4. Seed Historical Bookings across the last 30 days
  // We want to generate ~20 realistic bookings with higher weekend traffic to trigger "earns 32% more on weekends"
  const existingBookingsCount = await Booking.countDocuments({ host: host._id });
  if (existingBookingsCount < 10) {
    const primarySpot = createdSpots[0];
    const secondarySpot = createdSpots[1];

    const bookingsToCreate = [];
    const now = Date.now();

    for (let dayOffset = 28; dayOffset >= 1; dayOffset--) {
      const date = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      // Higher probability of booking on weekends or Friday
      const shouldBook = isWeekend ? true : dayOffset % 2 === 0;
      if (!shouldBook) continue;

      // Peak hours: 9 AM or 6 PM
      const startHour = isWeekend ? 18 : 9;
      date.setHours(startHour, 0, 0, 0);

      const durationHours = isWeekend ? 4 : 3;
      const endDate = new Date(date.getTime() + durationHours * 60 * 60 * 1000);

      const spotUsed = dayOffset % 3 === 0 ? secondarySpot : primarySpot;
      const basePrice = durationHours * spotUsed.pricePerHour;
      const platformFee = Math.max(10, Math.round(basePrice * 0.1));
      const tax = Math.round(platformFee * 0.18);
      const totalAmount = basePrice + platformFee + tax;

      bookingsToCreate.push({
        user: driver._id,
        host: host._id,
        parkingSpace: spotUsed._id,
        vehicle: vehicle._id,
        startTime: date,
        endTime: endDate,
        duration: durationHours,
        basePrice,
        platformFee,
        tax,
        totalAmount,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        qrToken: `QRPASS_HIST_${dayOffset}_${Math.random().toString(36).substring(7).toUpperCase()}`,
        checkInTime: date,
        checkOutTime: endDate,
        createdAt: date,
        updatedAt: endDate,
      });
    }

    if (bookingsToCreate.length > 0) {
      await Booking.insertMany(bookingsToCreate);
      console.log(`Successfully seeded ${bookingsToCreate.length} historical bookings.`);
    }
  } else {
    console.log(`Host already has ${existingBookingsCount} bookings in DB.`);
  }

  console.log('=== SAMPLE DATA SEEDING COMPLETE ===');
  await mongoose.disconnect();
};

seedSmartData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
