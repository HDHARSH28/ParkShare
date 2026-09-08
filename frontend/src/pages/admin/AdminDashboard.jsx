import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Home,
  ParkingSquare,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getDashboardStats } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const metricCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      sub: `${stats?.totalDrivers || 0} drivers registered`,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      link: '/admin/users',
    },
    {
      label: 'Total Hosts',
      value: stats?.totalHosts ?? '—',
      sub: 'Property partners',
      icon: Home,
      color: 'from-emerald-500 to-teal-600',
      link: '/admin/hosts',
    },
    {
      label: 'Parking Spaces',
      value: stats?.totalParkingSpaces ?? '—',
      sub: `${stats?.activeParkingSpaces || 0} active listings`,
      icon: ParkingSquare,
      color: 'from-purple-500 to-violet-600',
      link: '/admin/parking',
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? '—',
      sub: `${stats?.activeBookings || 0} currently active`,
      icon: CalendarDays,
      color: 'from-amber-500 to-orange-600',
      link: '/admin/bookings',
    },
    {
      label: 'Total Revenue',
      value: stats?.totalRevenue !== undefined ? `₹${stats.totalRevenue}` : '—',
      sub: `Platform fees: ₹${stats?.platformEarnings || 0}`,
      icon: CreditCard,
      color: 'from-sky-500 to-cyan-600',
      link: '/admin/payments',
    },
    {
      label: 'Active Bookings',
      value: stats?.activeBookings ?? '—',
      sub: 'Vehicles currently parked',
      icon: Clock,
      color: 'from-teal-500 to-emerald-600',
      link: '/admin/bookings',
    },
    {
      label: 'Pending Verification',
      value: stats?.pendingVerification ?? '—',
      sub: 'Awaiting host KYC approval',
      icon: ShieldCheck,
      color: 'from-amber-500 to-yellow-600',
      urgent: (stats?.pendingVerification || 0) > 0,
      link: '/admin/verification',
    },
    {
      label: 'Open Disputes',
      value: stats?.openDisputes ?? '—',
      sub: 'Requires arbitration',
      icon: ShieldAlert,
      color: 'from-rose-500 to-red-600',
      urgent: (stats?.openDisputes || 0) > 0,
      link: '/admin/disputes',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Platform Command Center</h1>
        <p className="text-xs text-surface-500 mt-1">
          Real-time oversight of marketplace users, parking inventory, transactions, and trust systems.
        </p>
      </div>

      {/* 8 Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m, i) => (
          <Link
            key={i}
            to={m.link}
            className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between ${
              m.urgent ? 'border-amber-300 bg-amber-50/20' : 'border-surface-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
                {m.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}
              >
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-surface-900">
                {loading ? '...' : m.value}
              </p>
              <p className="text-[11px] text-surface-500 mt-1 flex items-center gap-1">
                {m.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-surface-600 mb-4">
          Management Desks
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Host Verification Desk',
              desc: 'Inspect submitted ID & property tax documents to grant publishing privileges.',
              link: '/admin/verification',
              badge: stats?.pendingVerification ? `${stats.pendingVerification} Pending` : null,
              color: 'border-l-4 border-l-amber-500',
            },
            {
              title: 'Disputes & Resolution Console',
              desc: 'Investigate driver and host claims, apply arbitration notes, and issue refunds.',
              link: '/admin/disputes',
              badge: stats?.openDisputes ? `${stats.openDisputes} Open` : null,
              color: 'border-l-4 border-l-rose-500',
            },
            {
              title: 'Marketplace Intelligence & Analytics',
              desc: 'Visualize user growth, occupancy rates, booking demand, and revenue trends.',
              link: '/admin/analytics',
              badge: 'Recharts Active',
              color: 'border-l-4 border-l-indigo-500',
            },
          ].map((desk, idx) => (
            <Link
              key={idx}
              to={desk.link}
              className={`bg-white rounded-2xl border border-surface-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${desk.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-surface-900 text-sm">{desk.title}</h3>
                  {desk.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-800 border border-surface-200">
                      {desk.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-600 leading-relaxed">{desk.desc}</p>
              </div>
              <p className="text-xs font-semibold text-primary-600 mt-4 flex items-center gap-1">
                Open Console <ArrowRight className="w-3.5 h-3.5" />
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity: 5 Most Recent Bookings */}
      <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-surface-100 pb-4">
          <div>
            <h3 className="font-bold text-surface-900 text-base">Recent Platform Bookings</h3>
            <p className="text-xs text-surface-500">Live reservation traffic across all cities</p>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 transition"
          >
            View All Bookings →
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-surface-500 py-4">Loading recent activity...</p>
        ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
          <p className="text-xs text-surface-500 py-4">No recent bookings recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-surface-500 border-b border-surface-100 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Driver</th>
                  <th className="pb-3 font-semibold">Host</th>
                  <th className="pb-3 font-semibold">Spot</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-surface-800">
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-surface-50/60 transition">
                    <td className="py-3 font-medium text-surface-900">
                      {b.user?.name || 'Driver'}
                      <span className="block text-[10px] text-surface-500 font-normal">
                        {b.user?.email}
                      </span>
                    </td>
                    <td className="py-3">
                      {b.host?.name || 'Host'}
                      <span className="block text-[10px] text-surface-500 font-normal">
                        {b.host?.email}
                      </span>
                    </td>
                    <td className="py-3 max-w-[200px] truncate">
                      {b.parkingSpace?.title || 'Parking Spot'}
                      <span className="block text-[10px] text-surface-500">
                        {b.parkingSpace?.city}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-surface-900">₹{b.totalAmount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-surface-100 text-surface-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-surface-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
