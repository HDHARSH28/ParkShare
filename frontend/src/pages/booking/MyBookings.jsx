import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  ChevronRight,
  Loader2,
  AlertCircle,
  XCircle,
  Tag,
} from 'lucide-react';
import { getMyBookings, cancelBooking } from '../../services/bookingService';

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyBookings();
      if (res.success) {
        setBookings(res.data?.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setCancellingId(id);
      const res = await cancelBooking(id);
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: 'CANCELLED' } : b))
        );
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-surface-700 text-sm mt-1">
            Track your reserved parking spaces, slot times, and receipts
          </p>
        </div>
        <Link
          to="/parking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          Book Another Spot
        </Link>
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
          <p className="text-sm font-medium">Loading your bookings...</p>
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
          <h3 className="text-lg font-bold text-surface-900 mb-1">No bookings found</h3>
          <p className="text-sm text-surface-700 mb-6">
            {activeTab === 'ALL'
              ? "You haven't reserved any parking slots yet."
              : `No ${activeTab.toLowerCase()} bookings found.`}
          </p>
          <Link
            to="/parking"
            className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-sm hover:bg-primary-700 transition-colors"
          >
            Explore Nearby Spots
          </Link>
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
                {/* Left details */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden shrink-0 border border-surface-200 flex items-center justify-center">
                    {b.parkingSpace?.photos?.[0] ? (
                      <img
                        src={b.parkingSpace.photos[0]}
                        alt={b.parkingSpace.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-8 h-8 text-surface-700/40" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                      <span className="text-xs text-surface-700">ID: {b._id.slice(-6)}</span>
                    </div>

                    <h3 className="font-bold text-base text-surface-900 truncate">
                      {b.parkingSpace?.title || 'Parking Spot'}
                    </h3>

                    <p className="text-xs text-surface-700 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-600" />
                      {b.parkingSpace?.address}, {b.parkingSpace?.city}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-surface-700 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {startDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                        {b.duration}h)
                      </span>
                      {b.vehicle && (
                        <span className="flex items-center gap-1 font-mono font-medium text-surface-900">
                          <Car className="w-3.5 h-3.5" />
                          {b.vehicle.vehicleNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions & price */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-surface-100 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-surface-700">Total Amount</p>
                    <p className="text-xl font-black text-surface-900">₹{b.totalAmount}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['CONFIRMED', 'PENDING'].includes(b.status) && (
                      <button
                        type="button"
                        disabled={cancellingId === b._id}
                        onClick={() => handleCancelBooking(b._id)}
                        className="p-2 text-xs text-surface-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Cancel Booking"
                      >
                        {cancellingId === b._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {b.status === 'PENDING' && b.paymentStatus !== 'PAID' ? (
                      <Link
                        to={`/payment/${b._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                      >
                        <span>Pay Now</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to={`/bookings/${b._id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-surface-100 hover:bg-primary-50 hover:text-primary-700 text-surface-800 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Receipt
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
