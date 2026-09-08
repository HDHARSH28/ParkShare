import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Building2,
  Calendar,
  Car,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getMyListings } from '../../services/parkingService';
import { getHostBookings } from '../../services/bookingService';
import { getHostInsights, evaluateSmartAdvisories } from '../../services/smartService';
import LeavingHomeModal from '../../components/LeavingHomeModal';

const HostDashboard = () => {
  const { user } = useAuth();
  const [listingCount, setListingCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [isLeavingHomeOpen, setIsLeavingHomeOpen] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [listingsRes, bookingsRes, insightsRes] = await Promise.all([
        getMyListings(),
        getHostBookings(),
        getHostInsights().catch(() => null),
      ]);

      if (listingsRes?.success) {
        const list = listingsRes.data?.parkingSpaces || listingsRes.data;
        if (Array.isArray(list)) setListingCount(list.length);
      }

      if (bookingsRes?.success) {
        const bList = bookingsRes.data?.bookings || [];
        setBookingCount(bList.length);
        const earned = bList
          .filter((b) => b.status !== 'CANCELLED')
          .reduce((sum, b) => sum + (b.basePrice || 0), 0);
        setTotalEarned(earned);
      }

      if (insightsRes?.success) {
        setInsights(insightsRes.data?.insights);
      }
    } catch (e) {
      // silent fallback
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    evaluateSmartAdvisories().catch(() => {});
  }, []);

  const quickActions = [
    {
      icon: PlusCircle,
      title: 'List a Spot',
      desc: 'Add a new parking space',
      color: 'from-emerald-500 to-teal-600',
      link: '/host/parking/add',
      cta: 'Add Spot →',
    },
    {
      icon: Building2,
      title: 'My Listings',
      desc: 'Manage and publish your spots',
      color: 'from-blue-500 to-indigo-600',
      link: '/host/parking',
      cta: 'View All →',
    },
    {
      icon: Calendar,
      title: 'Incoming Reservations',
      desc: 'Check driver slots & vehicle numbers',
      color: 'from-violet-500 to-purple-600',
      link: '/host/bookings',
      cta: 'View Reservations →',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Host Dashboard</h1>
            <p className="text-surface-700 text-sm">Welcome back, {user?.name} 👋</p>
          </div>
        </div>

        {/* Special "I'm Leaving Home" Action Button */}
        <button
          onClick={() => setIsLeavingHomeOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Car className="w-4 h-4" />
          <span>"I'm Leaving Home" Mode</span>
          <ArrowUpRight className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* Verification Status Banner */}
      {user?.isVerified ? (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
              ✓ Verified Host
            </span>
            <p className="text-xs text-emerald-900 font-medium hidden sm:block">
              Your identity and property documents are approved. Your listings display the trust badge.
            </p>
          </div>
          <Link
            to="/verification"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
          >
            View Verification
          </Link>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="font-bold text-amber-900 text-sm">Host Verification Pending</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Only verified hosts can publish active parking spaces. Submit your documents to start receiving bookings.
            </p>
          </div>
          <Link
            to="/verification"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold self-start sm:self-auto shrink-0 shadow-sm transition"
          >
            Submit Documents
          </Link>
        </div>
      )}

      {/* Proactive Smart Advisories */}
      {insights?.advisories && insights.advisories.length > 0 && (
        <div className="mb-8 space-y-3">
          {insights.advisories.map((adv) => (
            <div
              key={adv.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                adv.type === 'DEMAND'
                  ? 'bg-gradient-to-r from-rose-50/80 to-amber-50/60 border-rose-200 text-rose-950'
                  : adv.type === 'OPTIMIZATION'
                  ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-blue-200 text-blue-950'
                  : 'bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    adv.type === 'DEMAND'
                      ? 'bg-rose-500 text-white'
                      : adv.type === 'OPTIMIZATION'
                      ? 'bg-blue-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {adv.type === 'DEMAND' ? '🔥' : adv.type === 'OPTIMIZATION' ? '⚡' : '✨'}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{adv.title}</h4>
                  <p className="text-xs mt-0.5 text-surface-700 leading-relaxed">{adv.message}</p>
                </div>
              </div>
              {adv.action && (
                <Link
                  to={adv.link || '/host/parking'}
                  className="px-3 py-1.5 bg-white border border-surface-200 hover:border-surface-300 text-surface-900 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0 shadow-sm transition"
                >
                  {adv.action} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Listings', value: `${listingCount}`, sub: 'Spots listed on ParkShare' },
          { label: 'Host Earnings', value: `₹${totalEarned}`, sub: 'From confirmed bookings' },
          { label: 'Driver Bookings', value: `${bookingCount}`, sub: 'Total incoming reservations' },
          {
            label: 'Reliability Score',
            value: `${user?.reliabilityScore !== undefined ? user.reliabilityScore : 100}%`,
            sub: 'Completion & attendance rate',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
            <p className="text-xs text-surface-700 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{s.value}</p>
            <p className="text-[11px] text-surface-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Host Insights & Smart Analytics Section */}
      {insights?.hasListings && (
        <div className="mb-10 bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-surface-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900">AI Host Insights & Intelligence</h2>
                <p className="text-xs text-surface-500">
                  Data-driven performance metrics, demand analytics, and revenue tips
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 self-start sm:self-auto">
              <BarChart3 className="w-3.5 h-3.5" />
              Heuristic Optimization Model
            </span>
          </div>

          {/* 4 Analytics Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Best Earning Hours */}
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80">
              <div className="flex items-center gap-2 text-surface-600 mb-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Best Earning Hours</span>
              </div>
              <p className="text-base font-bold text-surface-900">
                {insights.bestEarningHours?.[0] || '6 PM - 9 PM'}
              </p>
              <p className="text-[11px] text-surface-500 mt-1">
                Runner-up: {insights.bestEarningHours?.[1] || '9 AM - 12 PM'}
              </p>
            </div>

            {/* 2. Most Popular Days */}
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80">
              <div className="flex items-center gap-2 text-surface-600 mb-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Most Popular Days</span>
              </div>
              <p className="text-base font-bold text-surface-900">
                {insights.mostPopularDays?.join(' & ') || 'Friday & Saturday'}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                +{insights.weekendMultiplierPercent || 32}% higher weekend volume
              </p>
            </div>

            {/* 3. Average Occupancy */}
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80">
              <div className="flex items-center gap-2 text-surface-600 mb-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Average Occupancy</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-surface-900">{insights.occupancyRate}%</p>
                <span className="text-xs text-surface-500">of capacity</span>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, insights.occupancyRate)}%` }}
                />
              </div>
            </div>

            {/* 4. Monthly Revenue & Growth */}
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80">
              <div className="flex items-center gap-2 text-surface-600 mb-1.5">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Revenue</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-surface-900">₹{insights.monthlyRevenue}</p>
                {insights.revenueGrowth > 0 && (
                  <span className="text-xs font-bold text-emerald-600">
                    +{insights.revenueGrowth}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-surface-500 mt-1">
                Avg Rate: ₹{insights.averagePrice}/hr
              </p>
            </div>
          </div>

          {/* AI Strategy Tips Banner */}
          {insights.smartTips && insights.smartTips.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-primary-50/40 to-white border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900">
                  AI Revenue Optimization Advice
                </h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-surface-700">
                {insights.smartTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Booking Trends Bar Visualization */}
          {insights.bookingTrends && insights.bookingTrends.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 mb-3">
                4-Week Activity & Revenue Trajectory
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {insights.bookingTrends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-50 rounded-xl border border-surface-200/70 text-center"
                  >
                    <p className="text-[11px] font-semibold text-surface-500">{trend.weekLabel}</p>
                    <p className="text-base font-bold text-surface-900 mt-0.5">
                      {trend.bookings} bookings
                    </p>
                    <p className="text-xs text-primary-600 font-semibold mt-0.5">
                      ₹{trend.revenue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-3 gap-5">
        {quickActions.map((a, i) => {
          const cardContent = (
            <div className="group bg-white rounded-2xl border border-surface-200 p-6 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all h-full flex flex-col">
              <div className={`w-12 h-12 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                <a.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-surface-900">{a.title}</h3>
              <p className="text-sm text-surface-700 mt-1 flex-1">{a.desc}</p>
              <p className="text-xs text-primary-600 font-medium mt-3">{a.cta}</p>
            </div>
          );

          return (
            <Link key={i} to={a.link}>
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/* Leaving Home Modal */}
      <LeavingHomeModal
        isOpen={isLeavingHomeOpen}
        onClose={() => setIsLeavingHomeOpen(false)}
        onSuccess={loadStats}
      />
    </div>
  );
};

export default HostDashboard;
