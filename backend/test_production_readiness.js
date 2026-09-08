/**
 * ParkShare — Production Readiness End-to-End Test Suite
 * Validates Security, Database 2dsphere Indexes, Error Handling, Role Guards,
 * and the complete Driver, Host, and Admin lifecycles.
 */

const API_BASE = 'http://localhost:5002/api';

const runSuite = async () => {
  console.log('\n======================================================================');
  console.log('🚀 RUNNING PARKSHARE PRODUCTION READINESS INTEGRATION TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  const timestamp = Date.now().toString().slice(-6);
  const driverEmail = `driver_${timestamp}@test.com`;
  const hostEmail = `host_${timestamp}@test.com`;
  const adminEmail = `admin_${timestamp}@test.com`;
  const password = 'Password@123';

  let driverToken, driverId, hostToken, hostId, adminToken;
  let vehicleId, parkingId, bookingId;

  // -------------------------------------------------------------------------
  // 1. HEALTH CHECK & SECURITY HEADERS
  // -------------------------------------------------------------------------
  console.log('--- 1. Health Check & Security Headers ---');
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'API is running healthy');

    const cspHeader = healthRes.headers.get('content-security-policy');
    const corpHeader = healthRes.headers.get('cross-origin-resource-policy');
    const rateLimitHeader = healthRes.headers.get('ratelimit-limit');
    assert(!!cspHeader, 'Helmet Content-Security-Policy header present');
    assert(corpHeader === 'cross-origin', 'Helmet Cross-Origin-Resource-Policy configured');
    assert(!!rateLimitHeader, 'Rate limiting headers present in API response');
  } catch (err) {
    assert(false, 'Health check failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATION & PASSWORD SECURITY
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Authentication & Password Security ---');
  try {
    // Register Driver
    const regDriverRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Driver',
        email: driverEmail,
        phone: '+919811122233',
        password,
        role: 'DRIVER',
      }),
    });
    const regDriverData = await regDriverRes.json();
    assert(regDriverRes.status === 201 && regDriverData.success, 'Driver registration');
    driverToken = regDriverData.data.token;
    driverId = regDriverData.data.user._id;
    assert(!regDriverData.data.user.password, 'Password omitted from user JSON output');

    // Register Host
    const regHostRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Host',
        email: hostEmail,
        phone: '+919877788899',
        password,
        role: 'HOST',
      }),
    });
    const regHostData = await regHostRes.json();
    assert(regHostRes.status === 201 && regHostData.success, 'Host registration');
    hostToken = regHostData.data.token;
    hostId = regHostData.data.user._id;

    // Register Admin
    const regAdminRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Platform Admin',
        email: adminEmail,
        phone: '+919999000011',
        password,
        role: 'ADMIN',
      }),
    });
    const regAdminData = await regAdminRes.json();
    assert(regAdminRes.status === 201 && regAdminData.success, 'Admin registration');
    adminToken = regAdminData.data.token;

    // Duplicate Email Prevention (409 Conflict)
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: driverEmail,
        phone: '+919811122233',
        password,
      }),
    });
    assert(dupRes.status === 409, 'Duplicate email returns 409 Conflict');

    // Login Driver
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: driverEmail, password }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.data.token, 'Driver login successful');

    // Get Me (/auth/me)
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.user.email === driverEmail, 'Authenticated /auth/me route');
  } catch (err) {
    assert(false, 'Auth suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 3. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Authorization & Role-Based Access Control ---');
  try {
    // Driver attempting to create parking spot (HOST only)
    const driverCreateSpotRes = await fetch(`${API_BASE}/parking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ title: 'Illegal Spot' }),
    });
    assert(driverCreateSpotRes.status === 403, 'Driver blocked from creating parking spot (403)');

    // Driver attempting to access Admin Stats
    const driverAdminRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert(driverAdminRes.status === 403, 'Driver blocked from admin endpoints (403)');

    // Host attempting to access Admin Stats
    const hostAdminRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert(hostAdminRes.status === 403, 'Host blocked from admin endpoints (403)');

    // Admin accessing Admin Stats
    const adminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStatsRes.status === 200, 'Admin allowed to access admin endpoints (200)');
  } catch (err) {
    assert(false, 'RBAC suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 4. VEHICLE MANAGEMENT & VALIDATION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Vehicle Management & Validation ---');
  try {
    const plate = `MH12PS${timestamp.slice(-4)}`;
    const addVehRes = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        vehicleNumber: plate,
        vehicleType: 'Sedan',
        model: 'Honda City',
        color: 'Silver',
      }),
    });
    const addVehData = await addVehRes.json();
    assert(addVehRes.status === 201 && addVehData.success, 'Driver added vehicle');
    vehicleId = addVehData.data.vehicle._id;

    // Duplicate Vehicle Prevention
    const dupVehRes = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        vehicleNumber: plate,
        vehicleType: 'Sedan',
      }),
    });
    assert(dupVehRes.status === 409, 'Duplicate vehicle registration rejected with 409');
  } catch (err) {
    assert(false, 'Vehicle suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 5. HOST VERIFICATION (KYC)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Host KYC Verification ---');
  try {
    const submitKycRes = await fetch(`${API_BASE}/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        documents: [
          {
            documentType: 'Government ID',
            documentUrl: 'https://example.com/id.pdf',
            documentNumber: '123456789012',
          },
        ],
      }),
    });
    const submitKycData = await submitKycRes.json();
    assert(submitKycRes.status === 200 && submitKycData.success, 'Host submitted KYC verification');
    const verifId = submitKycData.data.verification._id;

    // Admin approves verification
    const approveRes = await fetch(`${API_BASE}/verifications/${verifId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED', adminComment: 'Verified government ID' }),
    });
    assert(approveRes.status === 200, 'Admin approved host verification');
  } catch (err) {
    assert(false, 'Verification suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 6. PARKING SPACE CRUD & GEOSPATIAL 2DSPHERE QUERIES
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Parking CRUD & Geospatial 2dsphere Queries ---');
  try {
    const createSpotRes = await fetch(`${API_BASE}/parking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        title: `Prime Covered Spot ${timestamp}`,
        description: 'Safe underground spot with security gate and CCTV coverage in Camp.',
        address: 'MG Road, Camp',
        city: 'Pune',
        latitude: 18.5167,
        longitude: 73.875,
        parkingType: 'Commercial',
        vehicleTypes: ['Sedan', 'SUV', 'Hatchback'],
        covered: true,
        security: true,
        cctv: true,
        gateAccess: true,
        pricePerHour: 40,
        pricePerDay: 400,
        pricePerMonth: 8000,
        status: 'active',
        availability: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          startTime: '06:00',
          endTime: '23:00',
        },
      }),
    });
    const createSpotData = await createSpotRes.json();
    assert(createSpotRes.status === 201 && createSpotData.success, 'Host created active parking space');
    parkingId = createSpotData.data.parking._id;

    // Verify GeoJSON location coordinates populated
    assert(
      Array.isArray(createSpotData.data.parking.location?.coordinates) &&
        createSpotData.data.parking.location.coordinates[0] === 73.875 &&
        createSpotData.data.parking.location.coordinates[1] === 18.5167,
      'GeoJSON coordinates synchronized automatically ([lng, lat])'
    );

    // Test Nearby Geospatial endpoint with MongoDB 2dsphere index
    const nearbyRes = await fetch(`${API_BASE}/parking/nearby?lat=18.5204&lng=73.8567&maxDistanceKm=10`);
    const nearbyData = await nearbyRes.json();
    assert(nearbyRes.status === 200, 'Geospatial /parking/nearby query succeeded');
    assert(
      nearbyData.data.parkingSpaces.some((s) => s._id === parkingId),
      'Newly listed spot found within 10km proximity via 2dsphere index'
    );

    // Test text search and filters
    const searchRes = await fetch(`${API_BASE}/parking?search=Camp&vehicleType=Sedan`);
    const searchData = await searchRes.json();
    assert(
      searchData.data.parkingSpaces.some((s) => s._id === parkingId),
      'Text and vehicle filter search'
    );
  } catch (err) {
    assert(false, 'Parking CRUD & Geo suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 7. BOOKING, PRICING & DOUBLE-BOOKING OVERLAP PREVENTION
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Booking, Pricing & Overlap Prevention ---');
  try {
    // Pick active slot starting in 15 minutes (within the 2h check-in window)
    const slotStart = new Date(Date.now() + 15 * 60 * 1000);
    const slotEnd = new Date(Date.now() + 2 * 3600 * 1000);
    const bookingDate = slotStart.toISOString().split('T')[0];
    const startISO = slotStart.toISOString();
    const endISO = slotEnd.toISOString();

    // Dynamic price quote calculation
    const quoteRes = await fetch(`${API_BASE}/bookings/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        parkingSpaceId: parkingId,
        startTime: startISO,
        endTime: endISO,
      }),
    });
    const quoteData = await quoteRes.json();
    assert(quoteRes.status === 200 && quoteData.data.totalAmount > 0, 'Smart pricing quote calculation');

    // Create Initial Booking (starts in PENDING)
    const bookRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        parkingSpaceId: parkingId,
        vehicleId,
        startTime: startISO,
        endTime: endISO,
      }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201 && bookData.data.booking.status === 'PENDING', 'Booking created in PENDING status');
    bookingId = bookData.data.booking._id;

    // Check Availability: Unpaid PENDING booking must NOT appear in bookedSlots
    const availRes = await fetch(`${API_BASE}/bookings/availability/${parkingId}?date=${bookingDate}`);
    const availData = await availRes.json();
    const isPendingInBooked = (availData.data.bookedSlots || []).some(
      (s) => s.startTime === startISO && s.status === 'PENDING'
    );
    assert(!isPendingInBooked, 'Unpaid PENDING booking is strictly omitted from bookedSlots');

    // Complete Payment
    const payRes = await fetch(`${API_BASE}/payments/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId,
        paymentMethod: 'UPI',
        transactionId: `TXN_${Date.now()}`,
      }),
    });
    const payData = await payRes.json();
    assert(payRes.status === 200 && payData.data.booking.paymentStatus === 'PAID', 'Payment verified and status marked PAID');

    // Check Availability again: Now that it is PAID & CONFIRMED, it MUST appear in bookedSlots
    const availAfterPay = await fetch(`${API_BASE}/bookings/availability/${parkingId}?date=${bookingDate}`);
    const availAfterPayData = await availAfterPay.json();
    const isPaidInBooked = (availAfterPayData.data.bookedSlots || []).some((s) => s.paymentStatus === 'PAID');
    assert(isPaidInBooked, 'Paid & Confirmed slot correctly marked as Booked in availability');

    // Double Booking Prevention: Attempting to book the overlapping slot MUST now fail with 400
    const conflictRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        parkingSpaceId: parkingId,
        vehicleId,
        startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      }),
    });
    assert(conflictRes.status === 400, 'Conflicting booking on paid slot correctly rejected (400 Bad Request)');
  } catch (err) {
    assert(false, 'Booking & Payment suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 8. QR PASS CHECK-IN & CHECK-OUT LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- 8. QR Pass Check-In & Check-Out Lifecycle ---');
  try {
    // Driver gets QR pass
    const qrPassRes = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const qrPassData = await qrPassRes.json();
    const qrToken = qrPassData.data.booking.qrToken;
    assert(qrPassRes.status === 200 && !!qrToken, 'Driver generated QR check-in pass');

    // Host checks in driver using QR code scan
    const checkInRes = await fetch(`${API_BASE}/bookings/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ qrToken, bookingId }),
    });
    const checkInData = await checkInRes.json();
    assert(checkInRes.status === 200 && checkInData.data.booking.status === 'ACTIVE', 'Host scanned QR: Check-in completed (status: ACTIVE)');

    // Host checks out driver
    const checkOutRes = await fetch(`${API_BASE}/bookings/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ qrToken, bookingId }),
    });
    const checkOutData = await checkOutRes.json();
    assert(checkOutRes.status === 200 && checkOutData.data.booking.status === 'COMPLETED', 'Host scanned QR: Check-out completed (status: COMPLETED)');
  } catch (err) {
    assert(false, 'QR lifecycle suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 9. REVIEWS, RATINGS & RELIABILITY SCORE
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Reviews, Ratings & Reliability Score ---');
  try {
    const reviewRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId,
        rating: 5,
        safetyRating: 5,
        cleanlinessRating: 5,
        locationRating: 5,
        comment: 'Outstanding spot, super convenient and secure!',
      }),
    });
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 201 && reviewData.success, 'Driver submitted verified review for completed booking');

    // Duplicate review prevention
    const dupReviewRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId,
        rating: 4,
      }),
    });
    assert(dupReviewRes.status === 400, 'Duplicate review for same booking strictly rejected (400)');

    // Check parking reviews list with pagination
    const getReviewsRes = await fetch(`${API_BASE}/reviews/parking/${parkingId}?page=1&limit=5`);
    const getReviewsData = await getReviewsRes.json();
    assert(getReviewsData.data.total >= 1 && getReviewsData.data.reviews.length >= 1, 'Parking reviews paginated lookup');
  } catch (err) {
    assert(false, 'Review suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 10. DISPUTES & RESOLUTION
  // -------------------------------------------------------------------------
  console.log('\n--- 10. Disputes & Resolution ---');
  try {
    const disputeRes = await fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId,
        reason: 'Payment issue',
        description: 'Test dispute report for testing admin resolution workflow.',
      }),
    });
    const disputeData = await disputeRes.json();
    assert(disputeRes.status === 201 && disputeData.success, 'Driver filed dispute');
    const disputeId = disputeData.data.dispute._id;

    // Admin resolves dispute
    const resolveRes = await fetch(`${API_BASE}/disputes/${disputeId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNote: 'Reviewed and resolved by admin team.',
      }),
    });
    assert(resolveRes.status === 200, 'Admin resolved dispute');
  } catch (err) {
    assert(false, 'Dispute suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // 11. ADMIN ANALYTICS & PAGINATED AUDITING
  // -------------------------------------------------------------------------
  console.log('\n--- 11. Admin Management & Analytics ---');
  try {
    const adminUsersRes = await fetch(`${API_BASE}/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    assert(adminUsersData.data.total > 0 && adminUsersData.data.users.length > 0, 'Admin paginated users query');

    const adminBookingsRes = await fetch(`${API_BASE}/admin/bookings?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminBookingsData = await adminBookingsRes.json();
    assert(adminBookingsData.data.total > 0, 'Admin paginated bookings query');

    const adminAnalyticsRes = await fetch(`${API_BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnalyticsData = await adminAnalyticsRes.json();
    assert(adminAnalyticsRes.status === 200 && adminAnalyticsData.success, 'Admin analytics computation');
  } catch (err) {
    assert(false, 'Admin suite failed', err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runSuite().catch((e) => {
  console.error('Fatal suite error:', e);
  process.exit(1);
});
