import crypto from 'crypto';

const API_BASE = 'http://localhost:5002/api';

async function runTests() {
  console.log('--- STARTING PHASE 4 INTEGRATION TESTS ---');

  // 1. Login Driver
  const driverLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@test.com', password: 'test123' }),
  });
  const driverLogin = await driverLoginRes.json();
  const driverToken = driverLogin.data?.token;
  console.log('1. Driver logged in:', !!driverToken);

  // 2. Login Host
  const hostLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'host@test.com', password: 'test123' }),
  });
  const hostLogin = await hostLoginRes.json();
  const hostToken = hostLogin.data?.token;
  console.log('2. Host logged in:', !!hostToken);

  // 3. Get parking space and driver vehicle
  const spacesRes = await fetch(`${API_BASE}/parking`);
  const spacesData = await spacesRes.json();
  const parkingSpace = spacesData.data?.parkingSpaces?.[0];

  const vehiclesRes = await fetch(`${API_BASE}/vehicles`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const vehiclesData = await vehiclesRes.json();
  const vehicle = vehiclesData.data?.vehicles?.[0];

  console.log('3. Parking Space:', parkingSpace?.title, 'Vehicle:', vehicle?.vehicleNumber);

  // Create future booking
  const now = new Date();
  const start = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
  const end = new Date(now.getTime() + 70 * 60 * 1000); // 70 minutes from now

  const createBookingRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      parkingSpaceId: parkingSpace._id,
      vehicleId: vehicle._id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    }),
  });
  const bookingData = await createBookingRes.json();
  const booking = bookingData.data?.booking;
  console.log('4. Booking created (ID):', booking?._id, 'Status:', booking?.status, 'PaymentStatus:', booking?.paymentStatus);

  if (!booking) {
    console.error('Failed to create booking:', bookingData);
    process.exit(1);
  }

  // 5. Create Razorpay order
  const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({ bookingId: booking._id }),
  });
  const orderData = await orderRes.json();
  console.log('5. Razorpay order created:', orderData.success, 'OrderId:', orderData.data?.orderId);

  const orderId = orderData.data?.orderId;
  const paymentId = `pay_${Date.now().toString(36)}`;

  // 6. Test INVALID cryptographic signature
  const fakeSignature = 'bad_forged_signature_hex_12345';
  const invalidVerifyRes = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      bookingId: booking._id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: fakeSignature,
    }),
  });
  const invalidVerifyData = await invalidVerifyRes.json();
  console.log('6. Invalid Signature Rejection:', invalidVerifyRes.status === 400 && !invalidVerifyData.success ? 'PASS (400 Bad Request)' : 'FAIL');

  // 7. Test VALID cryptographic signature
  const secret = 'parkshare_secret_test_key';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const validVerifyRes = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      bookingId: booking._id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    }),
  });
  const validVerifyData = await validVerifyRes.json();
  const confirmedBooking = validVerifyData.data?.booking;
  console.log('7. Valid Payment Verification:', validVerifyRes.status === 200 ? 'PASS' : 'FAIL', {
    status: confirmedBooking?.status,
    paymentStatus: confirmedBooking?.paymentStatus,
    hasQrCode: !!confirmedBooking?.qrCode,
    qrToken: confirmedBooking?.qrToken?.substring(0, 15) + '...',
  });

  // 8. Test DUPLICATE Payment Rejection
  const dupVerifyRes = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      bookingId: booking._id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    }),
  });
  console.log('8. Duplicate Payment Rejection:', dupVerifyRes.status === 400 ? 'PASS' : 'FAIL');

  // 9. Test Invalid QR Check-in
  const invalidQrRes = await fetch(`${API_BASE}/bookings/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({ qrData: 'NON_EXISTENT_QR_TOKEN_OR_DATA' }),
  });
  console.log('9. Invalid QR Check-In Rejection:', invalidQrRes.status === 404 || invalidQrRes.status === 400 ? 'PASS' : 'FAIL');

  // 10. Test Valid Host Check-In using qrToken
  const checkInRes = await fetch(`${API_BASE}/bookings/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({ qrToken: confirmedBooking.qrToken }),
  });
  const checkInData = await checkInRes.json();
  console.log('10. Valid Check-In:', checkInRes.status === 200 ? 'PASS' : 'FAIL', {
    status: checkInData.data?.booking?.status,
    checkInTime: checkInData.data?.booking?.checkInTime,
  });

  // 11. Test DOUBLE Check-In Rejection
  const doubleCheckInRes = await fetch(`${API_BASE}/bookings/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({ qrToken: confirmedBooking.qrToken }),
  });
  console.log('11. Double Check-In Rejection:', doubleCheckInRes.status === 400 ? 'PASS' : 'FAIL');

  // 12. Test Check-Out
  const checkOutRes = await fetch(`${API_BASE}/bookings/check-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({ qrToken: confirmedBooking.qrToken }),
  });
  const checkOutData = await checkOutRes.json();
  console.log('12. Valid Check-Out:', checkOutRes.status === 200 ? 'PASS' : 'FAIL', {
    status: checkOutData.data?.booking?.status,
    checkOutTime: checkOutData.data?.booking?.checkOutTime,
  });

  // 13. Test Cancelled Booking Rejection for Check-in
  // Create another booking and cancel it
  const cancelBookingRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      parkingSpaceId: parkingSpace._id,
      vehicleId: vehicle._id,
      startTime: new Date(now.getTime() + 120 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 180 * 60 * 1000).toISOString(),
    }),
  });
  const cancelBookingData = await cancelBookingRes.json();
  const toCancelId = cancelBookingData.data?.booking?._id;

  await fetch(`${API_BASE}/bookings/${toCancelId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
  });

  const checkInCancelledRes = await fetch(`${API_BASE}/bookings/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({ bookingId: toCancelId }),
  });
  console.log('13. Cancelled Booking Check-In Rejection:', checkInCancelledRes.status === 400 ? 'PASS' : 'FAIL');

  console.log('--- ALL BACKEND TESTS COMPLETED ---');
}

runTests().catch(console.error);
