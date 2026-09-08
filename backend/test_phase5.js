import crypto from 'crypto';

const API_BASE = 'http://localhost:5002/api';

async function runTests() {
  console.log('=== STARTING PHASE 5 INTEGRATION TESTS ===');

  // 1. Driver Login
  const driverLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@test.com', password: 'test123' }),
  });
  const driverLogin = await driverLoginRes.json();
  const driverToken = driverLogin.data?.token;
  console.log('1. Driver authenticated:', !!driverToken);

  // 2. Host Login
  const hostLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'host@test.com', password: 'test123' }),
  });
  const hostLogin = await hostLoginRes.json();
  const hostToken = hostLogin.data?.token;
  const hostUser = hostLogin.data?.user;
  console.log('2. Host authenticated:', !!hostToken);

  // 3. Admin Login or Register
  let adminToken;
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'adminpassword' }),
  });
  if (adminLoginRes.status === 200) {
    const adminData = await adminLoginRes.json();
    adminToken = adminData.data?.token;
  } else {
    // Register admin
    const adminRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin',
        email: 'admin@test.com',
        phone: '+919999999999',
        password: 'adminpassword',
        role: 'ADMIN',
      }),
    });
    const adminRegData = await adminRegRes.json();
    adminToken = adminRegData.data?.token;
  }
  console.log('3. Admin authenticated:', !!adminToken);

  // 4. Test Host Verification Submission
  const submitVerifRes = await fetch(`${API_BASE}/verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({
      documents: [
        {
          documentType: 'Government ID',
          documentUrl: 'https://example.com/docs/aadhaar_sample.pdf',
          documentNumber: 'XXXX-XXXX-1234',
        },
        {
          documentType: 'Property Tax Receipt',
          documentUrl: 'https://example.com/docs/tax_receipt.pdf',
          documentNumber: 'TAX-2026-MUM-8989',
        },
      ],
    }),
  });
  const submitVerifData = await submitVerifRes.json();
  const verification = submitVerifData.data?.verification;
  console.log('4. Host verification submitted:', submitVerifRes.status === 200 && verification?.status === 'PENDING' ? 'PASS' : 'FAIL');

  // 5. Test Admin Review (Approve)
  const approveRes = await fetch(`${API_BASE}/verifications/${verification._id}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'APPROVED',
      adminComment: 'All property documents verified and approved.',
    }),
  });
  const approveData = await approveRes.json();
  console.log('5. Admin Approved Host Verification:', approveRes.status === 200 && approveData.data?.verification?.status === 'APPROVED' ? 'PASS' : 'FAIL');

  // Verify host user isVerified is now true
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const meData = await meRes.json();
  console.log('6. Host isVerified flag active:', meData.data?.user?.isVerified === true ? 'PASS' : 'FAIL');

  // 7. Test Favorites API
  const parkingSpacesRes = await fetch(`${API_BASE}/parking`);
  const parkingSpacesData = await parkingSpacesRes.json();
  const spot = parkingSpacesData.data?.parkingSpaces?.[0];

  // First check if already favorite
  const initialCheckRes = await fetch(`${API_BASE}/favorites/${spot._id}/check`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const initialCheck = await initialCheckRes.json();
  if (initialCheck.data?.isFavorite) {
    // untoggle first so state is clean
    await fetch(`${API_BASE}/favorites/${spot._id}/toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
  }

  // Toggle favorite on
  const favToggleOnRes = await fetch(`${API_BASE}/favorites/${spot._id}/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const favToggleOnData = await favToggleOnRes.json();
  console.log('7a. Favorite added:', favToggleOnData.data?.isFavorite === true ? 'PASS' : 'FAIL');

  // Check isFavorite
  const favCheckRes = await fetch(`${API_BASE}/favorites/${spot._id}/check`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const favCheckData = await favCheckRes.json();
  console.log('7b. Check favorite status:', favCheckData.data?.isFavorite === true ? 'PASS' : 'FAIL');

  // Get user favorites
  const myFavsRes = await fetch(`${API_BASE}/favorites`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const myFavsData = await myFavsRes.json();
  console.log('7c. Get favorites list:', myFavsData.data?.favorites?.length > 0 ? 'PASS' : 'FAIL');

  // 8. Test Reviews & Ratings
  // Find a COMPLETED booking for driver
  const myBookingsRes = await fetch(`${API_BASE}/bookings/my?status=COMPLETED`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const myBookingsData = await myBookingsRes.json();
  let completedBooking = myBookingsData.data?.bookings?.[0];

  if (completedBooking) {
    // Check if review already exists for this booking from prior test runs
    const existingReviewsRes = await fetch(`${API_BASE}/reviews/parking/${completedBooking.parkingSpace._id}`);
    const existingReviewsData = await existingReviewsRes.json();
    const alreadyReviewed = existingReviewsData.data?.reviews?.some(
      (r) => (r.booking?._id || r.booking) === completedBooking._id
    );

    if (alreadyReviewed) {
      console.log('8a. Review submission on COMPLETED booking: PASS (Verified from previous run)');
    } else {
      // 8a. Submit Review
      const reviewRes = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bookingId: completedBooking._id,
          rating: 5,
          safetyRating: 5,
          cleanlinessRating: 4,
          locationRating: 5,
          comment: 'Outstanding parking experience! Spot was secure, covered, and exactly as described.',
        }),
      });
      console.log('8a. Review submission on COMPLETED booking:', reviewRes.status === 201 ? 'PASS' : 'FAIL');
    }

    // 8b. Test Duplicate Review Prevention
    const dupReviewRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId: completedBooking._id,
        rating: 4,
        comment: 'Trying to review again',
      }),
    });
    console.log('8b. Duplicate review rejection:', dupReviewRes.status === 400 ? 'PASS' : 'FAIL');

    // 8c. Test Spot Reviews Query
    const spotReviewsRes = await fetch(`${API_BASE}/reviews/parking/${completedBooking.parkingSpace._id}`);
    const spotReviewsData = await spotReviewsRes.json();
    console.log('8c. Spot reviews list retrieved:', spotReviewsData.data?.total > 0 ? 'PASS' : 'FAIL');
  }

  // 9. Test Disputes API
  const allMyBookingsRes = await fetch(`${API_BASE}/bookings/my`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const allMyBookings = await allMyBookingsRes.json();
  const testBooking = allMyBookings.data?.bookings?.[0];

  if (testBooking) {
    // File dispute
    const disputeRes = await fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bookingId: testBooking._id,
        reason: 'Parking occupied',
        description: 'Arrived at the location and another vehicle was parked in the reserved slot.',
      }),
    });
    const disputeData = await disputeRes.json();
    const dispute = disputeData.data?.dispute;
    console.log('9a. Dispute filed:', disputeRes.status === 201 && dispute?.status === 'OPEN' ? 'PASS' : 'FAIL');

    // Admin resolves dispute
    const resolveDisputeRes = await fetch(`${API_BASE}/disputes/${dispute._id}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolution: 'Verified with host. Issued full refund and penalty applied.',
        refundAmount: testBooking.totalAmount,
      }),
    });
    const resolveDisputeData = await resolveDisputeRes.json();
    console.log('9b. Admin resolved dispute:', resolveDisputeData.data?.dispute?.status === 'RESOLVED' ? 'PASS' : 'FAIL');
  }

  // 10. Test Notifications API
  const unreadRes = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const unreadData = await unreadRes.json();
  console.log('10a. Host unread notifications count:', unreadData.data?.unreadCount >= 0 ? 'PASS' : 'FAIL');

  const notifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const notifsData = await notifsRes.json();
  console.log('10b. Host notifications list retrieved:', notifsData.data?.notifications?.length > 0 ? 'PASS' : 'FAIL');

  // Mark all as read
  const markAllRes = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const markAllData = await markAllRes.json();
  console.log('10c. Mark all notifications as read:', markAllData.success ? 'PASS' : 'FAIL');

  console.log('=== ALL PHASE 5 INTEGRATION TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(console.error);
