import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  QrCode,
  ShieldCheck,
  User,
  Phone,
  Mail,
  XCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { getBookingById, cancelBooking } from '../../services/bookingService';
import useAuth from '../../hooks/useAuth';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getBookingById(id);
        if (res.success) {
          setBooking(res.data?.booking || res.data);
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      const res = await cancelBooking(id);
      if (res.success) {
        setBooking((prev) => ({ ...prev, status: 'CANCELLED' }));
        setCancelModal(false);
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-surface-700">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Loading booking receipt...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-surface-900 mb-1">Booking Not Found</h2>
        <p className="text-sm text-surface-700 mb-6">{error || 'This booking could not be retrieved.'}</p>
        <Link
          to="/bookings"
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const isDriver = user?._id === booking.user?._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to={isDriver ? '/bookings' : '/host/bookings'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {isDriver ? 'My Bookings' : 'Host Bookings'}
        </Link>
      </div>

      {/* Main Receipt Card */}
      <div className="bg-white rounded-3xl border border-surface-200 shadow-sm overflow-hidden mb-6">
        {/* Receipt Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
                Booking Pass & Receipt
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm font-bold">
                {booking.status}
              </span>
            </div>
            <h1 className="text-2xl font-black">Ref #{booking._id.slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-primary-100 mt-1">
              Booked on {new Date(booking.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
            <QrCode className="w-8 h-8 text-white" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-primary-100">
                Digital Pass
              </p>
              <p className="font-mono text-xs font-bold">
                {`PARK-${booking._id.slice(-6).toUpperCase()}`}
              </p>
            </div>
            {booking.paymentStatus === 'PAID' && (
              <Link
                to={`/booking/${booking._id}/qr`}
                className="ml-2 px-3 py-1 bg-white text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-bold transition shadow-sm"
              >
                View Pass
              </Link>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Parking Spot Card */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
            <div className="w-16 h-16 rounded-xl bg-surface-200 overflow-hidden shrink-0 flex items-center justify-center">
              {booking.parkingSpace?.photos?.[0] ? (
                <img
                  src={booking.parkingSpace.photos[0]}
                  alt="parking"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Car className="w-8 h-8 text-surface-700/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-surface-800 border border-surface-200">
                  {booking.parkingSpace?.parkingType}
                </span>
                <Link
                  to={`/parking/${booking.parkingSpace?._id}`}
                  className="text-xs font-semibold text-primary-600 hover:underline inline-flex items-center gap-1"
                >
                  View Spot <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <h2 className="font-bold text-base text-surface-900 mt-1 truncate">
                {booking.parkingSpace?.title}
              </h2>
              <p className="text-xs text-surface-700 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-600" />
                {booking.parkingSpace?.address}, {booking.parkingSpace?.city}
              </p>
            </div>
          </div>

          {/* Time & Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Slot */}
            <div className="p-5 rounded-2xl border border-surface-200 space-y-2">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                Slot Schedule
              </div>
              <div>
                <p className="text-xs text-surface-700">Date</p>
                <p className="font-semibold text-surface-900 text-sm">
                  {startDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-700">Hours</p>
                <p className="font-semibold text-surface-900 text-sm">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                  {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  <span className="text-xs font-normal text-surface-700">({booking.duration} hrs)</span>
                </p>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-5 rounded-2xl border border-surface-200 space-y-2">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
                <Car className="w-4 h-4" />
                Vehicle Info
              </div>
              <div>
                <p className="text-xs text-surface-700">License Plate</p>
                <p className="font-mono font-black text-surface-900 text-base">
                  {booking.vehicle?.vehicleNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-700">Model & Type</p>
                <p className="font-medium text-surface-900 text-sm">
                  {booking.vehicle?.model ? `${booking.vehicle.model} • ` : ''}
                  {booking.vehicle?.vehicleType} {booking.vehicle?.color ? `(${booking.vehicle.color})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* QR Entry Pass & Check-In Status */}
          {booking.paymentStatus === 'PAID' ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-50 to-primary-50/30 border border-primary-100 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-2.5 bg-white rounded-2xl border border-surface-200 shadow-sm shrink-0">
                {booking.qrCode ? (
                  <img
                    src={booking.qrCode}
                    alt="Entry QR"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 bg-surface-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-surface-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified QR Entry Pass
                </div>
                <h3 className="text-base font-bold text-surface-900">
                  Ready for Check-In
                </h3>
                <p className="text-xs text-surface-600 max-w-md">
                  Show this QR code or pass code{' '}
                  <span className="font-mono font-bold text-surface-900">
                    PARK-{booking._id.slice(-6).toUpperCase()}
                  </span>{' '}
                  to the host upon vehicle arrival.
                </p>

                {/* Timestamps */}
                {(booking.checkInTime || booking.checkOutTime) && (
                  <div className="pt-2 flex flex-wrap gap-4 text-xs">
                    {booking.checkInTime && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                        <span className="font-semibold">Checked In: </span>
                        {new Date(booking.checkInTime).toLocaleString('en-IN')}
                      </div>
                    )}
                    {booking.checkOutTime && (
                      <div className="p-2 bg-surface-100 border border-surface-200 rounded-lg text-surface-700">
                        <span className="font-semibold">Checked Out: </span>
                        {new Date(booking.checkOutTime).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to={`/booking/${booking._id}/qr`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    Open Mobile Pass View
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="inline-block px-2.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-md text-xs font-bold">
                  Payment Pending
                </span>
                <h3 className="text-base font-bold text-surface-900">Complete Payment</h3>
                <p className="text-xs text-surface-600">
                  Your spot is held. Complete payment of ₹{booking.totalAmount} to generate your QR Entry Pass.
                </p>
              </div>
              <Link
                to={`/payment/${booking._id}`}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition shrink-0"
              >
                Pay ₹{booking.totalAmount} Now
              </Link>
            </div>
          )}

          {/* Fare Breakdown */}
          <div className="p-5 rounded-2xl border border-surface-200 space-y-3">
            <h3 className="font-bold text-sm text-surface-900">Fare Breakdown & Payment Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-surface-700">
                <span>Base Parking Fee ({booking.duration}h)</span>
                <span className="font-semibold text-surface-900">₹{booking.basePrice}</span>
              </div>
              <div className="flex justify-between text-surface-700">
                <span>Platform & Service Fee</span>
                <span className="font-semibold text-surface-900">₹{booking.platformFee}</span>
              </div>
              <div className="flex justify-between text-surface-700">
                <span>GST / Taxes (18%)</span>
                <span className="font-semibold text-surface-900">₹{booking.tax}</span>
              </div>
              <hr className="border-surface-100" />
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-surface-900 text-sm">Total Amount</span>
                <span className="text-xl font-black text-surface-900">₹{booking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-surface-600">Payment Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                    booking.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {booking.paymentStatus}
                </span>
              </div>
              {(booking.transactionId || booking.razorpayPaymentId) && (
                <span className="text-surface-500 font-mono text-[11px]">
                  Ref: {booking.transactionId || booking.razorpayPaymentId}
                </span>
              )}
            </div>
          </div>

          {/* Host / Driver Contact Details */}
          <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
            <p className="font-bold uppercase text-surface-700 tracking-wider">
              {isDriver ? 'Spot Host Contact' : 'Driver Contact'}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-surface-900 font-semibold">
                <User className="w-3.5 h-3.5 text-primary-600" />
                {isDriver ? booking.host?.name : booking.user?.name}
              </div>
              {(isDriver ? booking.host?.phone : booking.user?.phone) && (
                <div className="flex items-center gap-1.5 text-surface-700">
                  <Phone className="w-3.5 h-3.5 text-primary-600" />
                  {isDriver ? booking.host?.phone : booking.user?.phone}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-surface-700">
                <Mail className="w-3.5 h-3.5 text-primary-600" />
                {isDriver ? booking.host?.email : booking.user?.email}
              </div>
            </div>
          </div>

          {/* Cancellation Action */}
          {['CONFIRMED', 'PENDING'].includes(booking.status) && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCancelModal(true)}
                className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel This Booking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-surface-900">Cancel Booking?</h3>
              <p className="text-xs text-surface-700 mt-1">
                Are you sure you want to cancel your slot reservation? This slot will immediately be
                released for other drivers.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-100 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
