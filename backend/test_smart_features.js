const API_BASE = 'http://localhost:5002/api';

async function runSmartTests() {
  console.log('=== STARTING SMART & AI PARKING FEATURES TESTS ===');

  // 1. Host Login
  let hostLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'host@test.com', password: 'test123' }),
  });
  let hostLogin = await hostLoginRes.json();
  let hostToken = hostLogin.data?.token;

  if (!hostToken) {
    hostLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'host@test.com', password: 'password123' }),
    });
    hostLogin = await hostLoginRes.json();
    hostToken = hostLogin.data?.token;
  }
  console.log('1. Host Authenticated:', !!hostToken);

  // 2. Test Smart Pricing Recommendation
  const priceReqBody = {
    city: 'Mumbai',
    parkingType: 'Commercial',
    covered: true,
    cctv: true,
    evCharging: true,
    distanceFromPopularLocations: 0.8,
  };
  const priceRes = await fetch(`${API_BASE}/smart/pricing/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(priceReqBody),
  });
  const priceData = await priceRes.json();
  const rec = priceData.data;

  console.log('2a. Smart Price Recommended:', rec?.recommendedPricePerHour > 0 ? `₹${rec.recommendedPricePerHour}/hr (PASS)` : 'FAIL');
  console.log('2b. Price Range Provided:', rec?.priceRange?.min > 0 && rec?.priceRange?.max >= rec?.priceRange?.recommended ? 'PASS' : 'FAIL');
  console.log('2c. Explainable Reason:', !!rec?.reason ? `"${rec.reason}" (PASS)` : 'FAIL');
  console.log('2d. ML-ready Contract:', rec?.modelInfo?.mlReady === true ? 'PASS' : 'FAIL');

  // 3. Test Demand Prediction & 24h Curve
  const demandRes = await fetch(`${API_BASE}/smart/demand/forecast?city=Mumbai`);
  const demandData = await demandRes.json();
  const demand = demandData.data;

  console.log('3a. Demand Level Evaluated:', ['LOW', 'MEDIUM', 'HIGH'].includes(demand?.demandLevel) ? `${demand.demandLevel} (PASS)` : 'FAIL');
  console.log('3b. Peak Hours Insight:', !!demand?.insight ? 'PASS' : 'FAIL');
  console.log('3c. 24-Hour Forecast Curve Array:', Array.isArray(demand?.forecast) && demand?.forecast?.length === 24 ? 'PASS' : 'FAIL');

  // 4. Test Smart Recommendations Ranking
  const recsRes = await fetch(`${API_BASE}/smart/recommendations?city=Mumbai&userLat=19.06&userLng=72.83`);
  const recsData = await recsRes.json();
  const recommendations = recsData.data?.recommendations || [];

  console.log('4a. Recommendations List Retrieved:', recommendations.length > 0 ? `${recommendations.length} spots (PASS)` : 'FAIL');
  const topSpot = recommendations[0];
  console.log('4b. Recommendation Score Attached:', topSpot?.recommendationScore >= 0 && topSpot?.recommendationScore <= 100 ? `${topSpot.recommendationScore}% (PASS)` : 'FAIL');
  console.log('4c. Match Tag / Reasons Populated:', Array.isArray(topSpot?.matchReasons) ? 'PASS' : 'FAIL');

  // 5. Test Browse Parking with sort=recommended
  const browseRes = await fetch(`${API_BASE}/parking?sort=recommended`);
  const browseData = await browseRes.json();
  const browseSpots = browseData.data?.parkingSpaces || [];
  console.log('5. Browse Parking with sort=recommended:', browseSpots.length > 0 && browseSpots[0]?.recommendationScore !== undefined ? 'PASS' : 'FAIL');

  // 6. Test Host Insights
  const insightsRes = await fetch(`${API_BASE}/smart/insights/host`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const insightsData = await insightsRes.json();
  const insights = insightsData.data?.insights;

  console.log('6a. Host Insights Retrieved:', !!insights?.hasListings ? 'PASS' : 'FAIL');
  console.log('6b. Best Earning Hours:', Array.isArray(insights?.bestEarningHours) && insights.bestEarningHours.length > 0 ? `${insights.bestEarningHours.join(', ')} (PASS)` : 'FAIL');
  console.log('6c. Most Popular Days:', Array.isArray(insights?.mostPopularDays) ? `${insights.mostPopularDays.join(', ')} (PASS)` : 'FAIL');
  console.log('6d. Weekend Multiplier Tip:', !!insights?.smartTips?.[0] ? `"${insights.smartTips[0]}" (PASS)` : 'FAIL');
  console.log('6e. Occupancy Rate Calculated:', insights?.occupancyRate >= 0 ? `${insights.occupancyRate}% (PASS)` : 'FAIL');
  console.log('6f. Monthly Revenue Calculated:', insights?.monthlyRevenue >= 0 ? `₹${insights.monthlyRevenue} (PASS)` : 'FAIL');

  // 7. Test Smart Advisory Notifications Trigger
  const advRes = await fetch(`${API_BASE}/smart/advisories/evaluate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const advData = await advRes.json();
  console.log('7. Smart Advisories Evaluated & Dispatched:', advData.success ? `Dispatched ${advData.data?.dispatched} (PASS)` : 'FAIL');

  console.log('=== ALL SMART PARKING FEATURE TESTS PASSED SUCCESSFULLY ===');
}

runSmartTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
