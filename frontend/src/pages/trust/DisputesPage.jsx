import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Car,
  FileText,
  DollarSign,
  Send,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  resolveDispute,
} from '../../services/disputeService';
import { getMyBookings } from '../../services/bookingService';
import useAuth from '../../hooks/useAuth';

const DISPUTE_REASONS = [
  'Parking occupied',
  'Wrong location',
  'Parking inaccessible',
  'Host issue',
  'Vehicle damage',
  'Payment issue',
  'Other',
];

const DisputesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [disputes, setDisputes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reason, setReason] = useState('Parking occupied');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState('');

  // Admin state
  const [adminFilter, setAdminFilter] = useState('ALL');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionText, setResolutionText] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadData();
  }, [isAdmin, adminFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (isAdmin) {
        const res = await getAllDisputes({ status: adminFilter });
        if (res.success) {
          setDisputes(res.data.disputes || []);
        }
      } else {
        const [disputeRes, bookingRes] = await Promise.all([
          getMyDisputes(),
          getMyBookings(),
        ]);
        if (disputeRes.success) setDisputes(disputeRes.data.disputes || []);
        if (bookingRes.success) {
          setBookings(bookingRes.data.bookings || []);
          if (bookingRes.data.bookings?.length > 0 && !selectedBookingId) {
            setSelectedBookingId(bookingRes.data.bookings[0]._id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    if (!selectedBookingId || !description.trim()) {
      setError('Please select a booking and provide an explanation');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');
      const photoArray = photos
        ? photos.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const res = await createDispute({
        bookingId: selectedBookingId,
        reason,
        description,
        photos: photoArray,
      });

      if (res.success) {
        setSuccessMsg('Dispute ticket submitted successfully. Our team will review the issue.');
        setDescription('');
        setPhotos('');
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminResolve = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;

    try {
      setResolving(true);
      const res = await resolveDispute(resolveModal._id, {
        status: resolutionStatus,
        resolution: resolutionText,
        refundAmount: Number(refundAmount) || 0,
      });

      if (res.success) {
        setResolveModal(null);
        setResolutionText('');
        setRefundAmount(0);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold mb-2">
          <ShieldAlert className="w-4 h-4" />
          Resolution & Support Center
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Dispute & Incident Reporting</h1>
        <p className="text-surface-600 text-xs sm:text-sm mt-1">
          Report parking obstructions, inaccessible gates, damage, or payment issues for prompt admin resolution.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Queue View */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-surface-900">Platform Dispute Tickets</h2>
            <div className="inline-flex p-1 bg-surface-100 rounded-xl border border-surface-200 text-xs font-semibold">
              {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAdminFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    adminFilter === st
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {disputes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-surface-200 shadow-sm text-surface-500 text-xs">
              No disputes found matching this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div
                  key={d._id}
                  className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-surface-900 text-sm">
                          Ticket #{d._id.slice(-6).toUpperCase()} • {d.reason}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'OPEN'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-surface-600 mt-0.5">
                        Spot: {d.parkingSpace?.title} • Driver: {d.user?.name} • Host: {d.host?.name}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setResolveModal(d);
                        setResolutionStatus('RESOLVED');
                        setResolutionText(d.resolution || '');
                        setRefundAmount(d.refundAmount || 0);
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition shrink-0"
                    >
                      Resolve / Refund
                    </button>
                  </div>

                  <p className="text-xs text-surface-700 leading-relaxed">"{d.description}"</p>

                  {d.resolution && (
                    <div className="p-3 bg-surface-50 rounded-xl text-xs space-y-1">
                      <p className="font-semibold text-surface-800">Admin Resolution:</p>
                      <p className="text-surface-600">{d.resolution}</p>
                      {d.refundAmount > 0 && (
                        <p className="text-emerald-700 font-bold">
                          Refund Assigned: ₹{d.refundAmount}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-surface-500 pt-1">
                    Filed on {new Date(d.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin Resolution Modal */}
          {resolveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-base text-surface-900">
                  Resolve Dispute #{resolveModal._id.slice(-6).toUpperCase()}
                </h3>

                <form onSubmit={handleAdminResolve} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">Status</label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">
                      Resolution Explanation
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Explain action taken or why dispute was accepted/rejected"
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">
                      Refund Amount (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResolveModal(null)}
                      className="px-4 py-2 border border-surface-200 rounded-xl font-semibold text-surface-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resolving}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                      {resolving ? 'Updating...' : 'Save Resolution'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Driver / Host View */
        <div className="space-y-8">
          {/* File New Dispute Form */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-3xl border border-surface-200 shadow-sm p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Report an Issue on a Reservation
              </h2>

              <form onSubmit={handleCreateDispute} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">
                      Select Booking
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {bookings.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.parkingSpace?.title} ({new Date(b.startTime).toLocaleDateString('en-IN')}) — ₹{b.totalAmount}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {DISPUTE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-surface-700 block mb-1">
                    Describe what happened in detail
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific details about timing, gate access, unauthorized vehicle license plate, etc."
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-surface-700 block mb-1">
                    Photo Evidence URLs (Optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={photos}
                    onChange={(e) => setPhotos(e.target.value)}
                    placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                    className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Dispute...' : 'File Dispute Ticket'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User's Dispute History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Your Dispute Tickets ({disputes.length})
            </h2>

            {disputes.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-surface-200 shadow-sm text-surface-500 text-xs">
                No active or past disputes reported on your account.
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((d) => (
                  <div
                    key={d._id}
                    className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-surface-900 text-sm">
                            #{d._id.slice(-6).toUpperCase()} • {d.reason}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              d.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'OPEN'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <p className="text-xs text-surface-600 mt-0.5">
                          Spot: {d.parkingSpace?.title} ({d.parkingSpace?.city})
                        </p>
                      </div>

                      <span className="text-[11px] text-surface-500">
                        {new Date(d.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-surface-700 leading-relaxed">"{d.description}"</p>

                    {d.resolution && (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-emerald-900">Admin Resolution:</p>
                        <p className="text-emerald-800">{d.resolution}</p>
                        {d.refundAmount > 0 && (
                          <p className="font-bold text-emerald-900">
                            Refund Approved: ₹{d.refundAmount}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesPage;
