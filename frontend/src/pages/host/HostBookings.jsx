import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { getHostBookings } from '../../services/bookingService';

const STATUS_TABS = ['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const HostBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHostBookings();
      if (res.success) {
        setBookings(res.data?.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching host bookings:', err);
      setError(err.response?.data?.message || 'Failed to load incoming reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const activeCount = bookings.filter((b) => b.status === 'ACTIVE').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Incoming Reservations
          </h1>
          <p className="text-surface-700 text-sm mt-1">
            Monitor incoming drivers, check vehicle numbers, and review slot schedules
          </p>
        </div>
        <Link
          to="/host/parking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-800 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
        >
          <Building className="w-4 h-4" />
          My Listings
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-surface-700">Total Bookings</p>
          <p className="text-2xl font-black text-surface-900 mt-1">{bookings.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-600">Confirmed</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-600">Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-purple-600">Completed</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-surface-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                : 'text-surface-700 hover:text-surface-900 hover:bg-surface-50'
            }`}
          >
            {tab === 'ALL' ? 'All Bookings' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-700">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Loading incoming reservations...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-surface-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-surface-700">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">No reservations found</h3>
          <p className="text-sm text-surface-700">
            {activeTab === 'ALL'
              ? 'No drivers have booked your spots yet.'
              : `No ${activeTab.toLowerCase()} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const startDate = new Date(b.startTime);
            const endDate = new Date(b.endTime);

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs font-semibold text-primary-700">
                      Spot: {b.parkingSpace?.title}
                    </span>
                    <span className="text-xs text-surface-700">ID: {b._id.slice(-6)}</span>
                  </div>

                  {/* Driver details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-surface-900">
                      <User className="w-3.5 h-3.5 text-primary-600" />
                      {b.user?.name || 'Driver'}
                    </span>
                    {b.user?.phone && (
                      <span className="flex items-center gap-1 text-surface-700">
                        <Phone className="w-3.5 h-3.5 text-primary-600" />
                        {b.user.phone}
                      </span>
                    )}
                    {b.vehicle && (
                      <span className="flex items-center gap-1 font-mono font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded">
                        <Car className="w-3.5 h-3.5 text-primary-600" />
                        {b.vehicle.vehicleNumber} ({b.vehicle.model || b.vehicle.vehicleType})
                      </span>
                    )}
                  </div>

                  {/* Slot timing */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-700">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {startDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        weekday: 'short',
                      })}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-surface-900">
                      <Clock className="w-3.5 h-3.5 text-primary-600" />
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                      {b.duration}h)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-surface-100 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-surface-700">Host Payout</p>
                    <p className="text-lg font-black text-emerald-600">₹{b.basePrice}</p>
                  </div>
                  <Link
                    to={`/bookings/${b._id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-surface-100 hover:bg-primary-50 hover:text-primary-700 text-surface-800 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HostBookings;
