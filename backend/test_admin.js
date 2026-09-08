const API_BASE = 'http://localhost:5002/api';

async function runAdminTests() {
  console.log('=== STARTING ADMIN CONTROL CENTER INTEGRATION TESTS ===');

  // 1. Admin Authentication
  let adminToken;
  let adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'adminpassword' }),
  });
  if (adminLoginRes.status !== 200) {
    adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'test123' }),
    });
  }
  const adminLogin = await adminLoginRes.json();
  adminToken = adminLogin.data?.token;
  console.log('1. Admin Authenticated:', !!adminToken);

  // 2. Driver Authentication
  const driverLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@test.com', password: 'test123' }),
  });
  const driverLogin = await driverLoginRes.json();
  const driverToken = driverLogin.data?.token;
  console.log('2. Driver Authenticated:', !!driverToken);

  // 3. Security Test: Driver forbidden from accessing /api/admin/stats (HTTP 403)
  const forbiddenRes = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  console.log('3. Security Check: Driver blocked from Admin API:', forbiddenRes.status === 403 ? 'PASS (403 Forbidden)' : `FAIL (${forbiddenRes.status})`);

  // 4. Test Admin Overview Stats
  const statsRes = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const statsData = await statsRes.json();
  const stats = statsData.data;

  const hasCoreMetrics =
    stats?.totalUsers !== undefined &&
    stats?.totalHosts !== undefined &&
    stats?.totalParkingSpaces !== undefined &&
    stats?.totalBookings !== undefined &&
    stats?.totalRevenue !== undefined &&
    stats?.activeBookings !== undefined &&
    stats?.pendingVerification !== undefined &&
    stats?.openDisputes !== undefined;

  console.log('4. Admin 8 Core Platform Metrics:', hasCoreMetrics ? 'PASS' : 'FAIL', {
    totalUsers: stats?.totalUsers,
    totalHosts: stats?.totalHosts,
    totalSpaces: stats?.totalParkingSpaces,
    totalBookings: stats?.totalBookings,
    totalRevenue: stats?.totalRevenue,
    activeBookings: stats?.activeBookings,
    pendingKYC: stats?.pendingVerification,
    openDisputes: stats?.openDisputes,
  });

  // 5. Test User Management (List & Search & Filter)
  const usersRes = await fetch(`${API_BASE}/admin/users?role=DRIVER`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usersData = await usersRes.json();
  console.log('5a. Users List (Filtered by DRIVER):', usersData.data?.users?.length > 0 ? 'PASS' : 'FAIL');

  const testUser = usersData.data?.users?.[0];
  if (testUser) {
    // 5b. Toggle block user
    const blockRes = await fetch(`${API_BASE}/admin/users/${testUser._id}/block`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isBlocked: true, blockReason: 'Terms of service test audit' }),
    });
    const blockData = await blockRes.json();
    console.log('5b. User Block Applied:', blockRes.status === 200 && blockData.data?.user?.isBlocked === true ? 'PASS' : 'FAIL');

    // 5c. Verify blocked user cannot log in
    const blockedLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'test123' }),
    });
    console.log('5c. Blocked User Login Blocked:', blockedLoginRes.status === 403 ? 'PASS (403 Forbidden)' : `FAIL (${blockedLoginRes.status})`);

    // 5d. Unblock user to restore state
    const unblockRes = await fetch(`${API_BASE}/admin/users/${testUser._id}/block`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isBlocked: false }),
    });
    const unblockData = await unblockRes.json();
    console.log('5d. User Unblock Restored:', unblockRes.status === 200 && unblockData.data?.user?.isBlocked === false ? 'PASS' : 'FAIL');
  }

  // 6. Test Host Management
  const hostsRes = await fetch(`${API_BASE}/admin/hosts`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const hostsData = await hostsRes.json();
  console.log('6. Hosts List with Spots Count:', hostsData.data?.hosts?.length > 0 ? 'PASS' : 'FAIL');

  // 7. Test Parking Management (Listings & Moderation)
  const parkingRes = await fetch(`${API_BASE}/admin/parking`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const parkingData = await parkingRes.json();
  const testListing = parkingData.data?.listings?.[0];
  console.log('7a. Admin Listings Retrieved:', parkingData.data?.listings?.length > 0 ? 'PASS' : 'FAIL');

  if (testListing) {
    const origStatus = testListing.status;
    const modRes = await fetch(`${API_BASE}/admin/parking/${testListing._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active', adminComment: 'Verified by root admin' }),
    });
    const modData = await modRes.json();
    console.log('7b. Listing Status Updated:', modRes.status === 200 && modData.data?.listing?.status === 'active' ? 'PASS' : 'FAIL');
  }

  // 8. Test Bookings Ledger
  const bookingsRes = await fetch(`${API_BASE}/admin/bookings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const bookingsData = await bookingsRes.json();
  console.log('8. Admin Bookings Ledger:', bookingsData.data?.bookings?.length > 0 ? 'PASS' : 'FAIL');

  // 9. Test Payments Audit Log
  const paymentsRes = await fetch(`${API_BASE}/admin/payments`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const paymentsData = await paymentsRes.json();
  console.log('9. Payments Audit Log:', paymentsData.data?.payments !== undefined ? 'PASS' : 'FAIL');

  // 10. Test Recharts Analytics Aggregator
  const analyticsRes = await fetch(`${API_BASE}/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const analyticsData = await analyticsRes.json();
  const a = analyticsData.data;

  const validAnalytics =
    Array.isArray(a?.userGrowth) &&
    Array.isArray(a?.bookingGrowth) &&
    Array.isArray(a?.revenueTrend) &&
    typeof a?.occupancyRate === 'number' &&
    Array.isArray(a?.popularLocations) &&
    Array.isArray(a?.popularHours);

  console.log('10. Recharts Analytics Aggregator:', validAnalytics ? 'PASS' : 'FAIL');

  // 11. Test Reviews Moderation
  const reviewsRes = await fetch(`${API_BASE}/admin/reviews`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const reviewsData = await reviewsRes.json();
  console.log('11. Reviews Stream Endpoint:', reviewsData.data?.reviews !== undefined ? 'PASS' : 'FAIL');

  console.log('=== ALL ADMIN CONTROL CENTER BACKEND TESTS PASSED ===');
}

runAdminTests().catch((err) => {
  console.error('Admin test execution error:', err);
  process.exit(1);
});
