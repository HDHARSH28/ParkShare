import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Car,
  User,
  CreditCard,
  QrCode,
  MapPin,
  RefreshCw,
  Loader,
  ArrowRight,
} from 'lucide-react';
import { getAdminBookings } from '../../services/adminService';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAdminBookings({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setBookings(res.data.bookings || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalBookings(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Disputed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
            PAID
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
            REFUNDED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            {status || 'PENDING'}
          </span>
        );
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor real-time reservations, payment settlements, check-ins, and statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalBookings} Total Bookings
          </span>
          <button
            onClick={fetchBookings}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search booking ID or driver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 ml-1 hidden sm:block" />
          {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Bookings' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading bookings ledger...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No bookings match criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5">Driver & Host</th>
                  <th className="px-4 py-3.5">Parking Space</th>
                  <th className="px-4 py-3.5">Slot / Time</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        #{booking._id.slice(-6).toUpperCase()}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase w-10">Driver:</span>
                          <span className="font-medium text-slate-900 text-xs">{booking.user?.name || 'User'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase w-10">Host:</span>
                          <span className="text-slate-600 text-xs">{booking.host?.name || 'Host'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 text-xs line-clamp-1">
                        {booking.parkingSpace?.title || 'Parking Listing'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {booking.parkingSpace?.city || 'India'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-700">
                        <p className="font-medium">{formatDateTime(booking.startTime)}</p>
                        <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                          to {formatDateTime(booking.endTime)} ({booking.duration || 1}h)
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 text-xs">₹{booking.totalAmount}</p>
                      <div className="mt-1">{getPaymentBadge(booking.paymentStatus)}</div>
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(booking.status)}</td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                  Booking #{selectedBooking._id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedBooking.parkingSpace?.title || 'Parking Reservation'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              {/* Status Row */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 block">Booking Status</span>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Payment Settlement</span>
                  <div className="mt-1">{getPaymentBadge(selectedBooking.paymentStatus)}</div>
                </div>
              </div>

              {/* Driver & Host Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Driver Information
                  </span>
                  <p className="font-semibold text-slate-800">{selectedBooking.user?.name || 'Driver'}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.user?.email}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.user?.phone || 'No phone'}</p>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Host Information
                  </span>
                  <p className="font-semibold text-slate-800">{selectedBooking.host?.name || 'Host'}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.host?.email}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.host?.phone || 'No phone'}</p>
                </div>
              </div>

              {/* Vehicle & Parking Location */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" /> Assigned Vehicle:
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedBooking.vehicle
                      ? `${selectedBooking.vehicle.vehicleNumber} (${selectedBooking.vehicle.model || selectedBooking.vehicle.vehicleType})`
                      : 'Not attached'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location:
                  </span>
                  <span className="font-medium text-slate-700 text-xs text-right max-w-xs truncate">
                    {selectedBooking.parkingSpace?.address}, {selectedBooking.parkingSpace?.city}
                  </span>
                </div>
              </div>

              {/* Schedule and Timestamps */}
              <div className="p-3 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Start:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(selectedBooking.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled End:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(selectedBooking.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Checked-in At:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(selectedBooking.checkInTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Checked-out At:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(selectedBooking.checkOutTime)}</span>
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Price ({selectedBooking.duration || 1} hrs)</span>
                  <span>₹{selectedBooking.basePrice || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee</span>
                  <span>₹{selectedBooking.platformFee || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax</span>
                  <span>₹{selectedBooking.tax || 0}</span>
                </div>
                <div className="border-t border-indigo-100 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Paid by Driver</span>
                  <span className="text-indigo-600">₹{selectedBooking.totalAmount}</span>
                </div>
              </div>

              {/* Transaction Ref if available */}
              {(selectedBooking.transactionId || selectedBooking.razorpayPaymentId) && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                  <span>Txn Ref: <span className="font-mono text-slate-600">{selectedBooking.transactionId || selectedBooking.razorpayPaymentId}</span></span>
                  {selectedBooking.paymentMethod && <span>Method: <span className="font-semibold text-slate-700">{selectedBooking.paymentMethod}</span></span>}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
