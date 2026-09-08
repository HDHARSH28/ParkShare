import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Search, Heart, Star, ShieldAlert, Bell, Clock } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getMyBookings } from '../../services/bookingService';
import { getMyFavorites } from '../../services/favoriteService';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getMyBookings();
        if (res.success) {
          const list = res.data?.bookings || [];
          setTotalBookingsCount(list.length);
          const active = list.filter((b) => ['CONFIRMED', 'ACTIVE'].includes(b.status));
          setActiveBookingsCount(active.length);
          const spent = list
            .filter((b) => b.status !== 'CANCELLED')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
          setTotalSpent(Math.round(spent));
        }
      } catch (e) {
        // silent fallback
      }

      try {
        const favRes = await getMyFavorites();
        if (favRes.success) {
          setFavoritesCount(favRes.data?.favorites?.length || 0);
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    {
      icon: Search,
      title: 'Find Parking',
      desc: 'Search nearby verified parking spaces',
      color: 'from-blue-500 to-indigo-600',
      link: '/parking',
      cta: 'Explore Spots →',
    },
    {
      icon: MapPin,
      title: 'My Bookings',
      desc: 'Active reservations & digital QR passes',
      color: 'from-emerald-500 to-teal-600',
      link: '/bookings',
      cta: 'View Bookings →',
    },
    {
      icon: Heart,
      title: 'Saved Favorites',
      desc: 'Quick access to your preferred spots',
      color: 'from-rose-500 to-pink-600',
      link: '/favorites',
      cta: 'View Favorites →',
    },
    {
      icon: Star,
      title: 'Rate & Review',
      desc: 'Share your experience on completed stays',
      color: 'from-amber-500 to-yellow-600',
      link: '/reviews',
      cta: 'Write Reviews →',
    },
    {
      icon: ShieldAlert,
      title: 'Resolution Desk',
      desc: 'File disputes, report issues & check refund status',
      color: 'from-purple-500 to-violet-600',
      link: '/disputes',
      cta: 'Dispute Center →',
    },
    {
      icon: Bell,
      title: 'Notifications',
      desc: 'Booking alerts, check-ins, & updates',
      color: 'from-sky-500 to-cyan-600',
      link: '/notifications',
      cta: 'View Alerts →',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Driver Dashboard</h1>
            <p className="text-surface-700 text-sm">Welcome back, {user?.name} 👋</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Bookings', value: `${activeBookingsCount}`, sub: 'Slots currently reserved' },
          { label: 'Total Spent', value: `₹${totalSpent}`, sub: 'All-time parking charges' },
          { label: 'Total Bookings', value: `${totalBookingsCount}`, sub: 'Completed and scheduled' },
          { label: 'Saved Favorites', value: `${favoritesCount}`, sub: 'Bookmarked locations' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
            <p className="text-xs text-surface-700 font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-surface-900 mt-1">{s.value}</p>
            <p className="text-xs text-surface-700 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-surface-900">Driver Hub & Trust Services</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {quickActions.map((a, i) => (
          <Link
            key={i}
            to={a.link}
            className="group bg-white rounded-2xl border border-surface-200 p-6 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all flex flex-col"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform`}
            >
              <a.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-surface-900">{a.title}</h3>
            <p className="text-sm text-surface-700 mt-1 flex-1">{a.desc}</p>
            <p className="text-xs text-primary-600 font-semibold mt-4 flex items-center gap-1">
              {a.cta}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DriverDashboard;
