import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Calendar,
  Car,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  QrCode,
  Zap,
  Smartphone,
  Building,
  Banknote,
  Check,
} from 'lucide-react';
import { getBookingById } from '../../services/bookingService';
import { processDirectPayment, reportPaymentFailure } from '../../services/paymentService';
import useAuth from '../../hooks/useAuth';

const PaymentCheckout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING' | 'CASH'

  // Method specific inputs
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [cardData, setCardData] = useState({
    number: '',
    name: user?.name || '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getBookingById(bookingId);
      if (res.success) {
        setBooking(res.data.booking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndConfirm = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      const res = await processDirectPayment({
        bookingId: booking._id,
        paymentMethod,
      });

      if (res.success) {
        navigate(`/booking-success?bookingId=${booking._id}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Payment processing failed';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelAndRelease = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking and free the reserved time slot?')) {
      return;
    }

    try {
      setCancelling(true);
      await reportPaymentFailure({
        bookingId: booking._id,
        reason: 'Cancelled by user before payment',
      });
      setBooking((prev) => ({ ...prev, status: 'CANCELLED', paymentStatus: 'FAILED' }));
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert(err.response?.data?.message || 'Failed to release slot');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-surface-900 mb-2">Error Loading Booking</h2>
        <p className="text-surface-600 mb-6">{error}</p>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  // Already paid
  if (booking.paymentStatus === 'PAID') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-surface-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Booking Already Paid!</h2>
        <p className="text-surface-600 mb-6">
          Your payment of ₹{booking.totalAmount} has been confirmed and your QR Pass is ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/booking/${booking._id}/qr`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg shadow-primary-500/25 transition"
          >
            <QrCode className="w-5 h-5" />
            View QR Booking Pass
          </Link>
          <Link
            to={`/bookings/${booking._id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition"
          >
            Booking Details
          </Link>
        </div>
      </div>
    );
  }

  // Cancelled or Failed
  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED' || booking.paymentStatus === 'FAILED') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-surface-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Reservation Cancelled & Slot Freed</h2>
        <p className="text-surface-600 mb-6 text-sm">
          This booking was cancelled or the payment was not completed. The reserved time slot has been freed immediately and is no longer marked as booked.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/parking"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
          >
            Find Another Spot
          </Link>
          <Link
            to={`/booking/${booking.parkingSpace?._id || booking.parkingSpace}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition"
          >
            Re-book This Spot
          </Link>
        </div>
      </div>
    );
  }

  const startFormatted = new Date(booking.startTime).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endFormatted = new Date(booking.endTime).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Instant Confirmed Checkout
        </div>
        <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">Complete Your Reservation</h1>
        <p className="text-surface-600 mt-1 text-sm">
          Select your preferred payment method to instantly confirm your parking spot and generate your QR Entry Pass.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelAndRelease}
            disabled={cancelling}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg shrink-0 transition self-start sm:self-auto"
          >
            {cancelling ? 'Releasing slot...' : 'Cancel & Release Slot Now'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Options */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" /> Select Payment Method
            </h2>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'UPI'
                    ? 'bg-primary-50/70 border-primary-500 text-primary-700 font-bold shadow-xs'
                    : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100 font-medium'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'CARD'
                    ? 'bg-primary-50/70 border-primary-500 text-primary-700 font-bold shadow-xs'
                    : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100 font-medium'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'NETBANKING'
                    ? 'bg-primary-50/70 border-primary-500 text-primary-700 font-bold shadow-xs'
                    : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100 font-medium'
                }`}
              >
                <Building className="w-5 h-5" />
                <span className="text-xs">NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'CASH'
                    ? 'bg-primary-50/70 border-primary-500 text-primary-700 font-bold shadow-xs'
                    : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100 font-medium'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Pay at Spot</span>
              </button>
            </div>

            {/* UPI View */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
                    UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mobileNumber@upi, username@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                    <span
                      key={app}
                      className="px-2.5 py-1 bg-white border border-surface-200 rounded-lg text-surface-700 font-medium"
                    >
                      ✓ {app} Supported
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-surface-500">
                  Clicking "Pay & Confirm" will simulate instant UPI verification and immediately issue your QR booking pass.
                </p>
              </div>
            )}

            {/* Card View */}
            {paymentMethod === 'CARD' && (
              <div className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-200 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12/28"
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NetBanking View */}
            {paymentMethod === 'NETBANKING' && (
              <div className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-200">
                <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1">
                  Select Bank
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2.5 text-xs font-medium rounded-xl border transition text-left flex items-center justify-between ${
                        selectedBank === b
                          ? 'bg-white border-primary-600 text-primary-700 font-bold shadow-xs'
                          : 'bg-white border-surface-200 text-surface-700 hover:bg-surface-100'
                      }`}
                    >
                      <span>{b}</span>
                      {selectedBank === b && <Check className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pay at Spot View */}
            {paymentMethod === 'CASH' && (
              <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 text-xs text-surface-600 space-y-2">
                <div className="flex items-center gap-2 font-bold text-surface-800 text-sm">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  Pay Directly at Parking Space
                </div>
                <p>
                  You will pay cash or direct UPI to the host upon check-in. Your booking will be confirmed immediately and a valid QR pass will be issued.
                </p>
              </div>
            )}

            {/* Pay Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handlePayAndConfirm}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-base rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{booking.totalAmount} & Confirm Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Cancel & Release Hold Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleCancelAndRelease}
                disabled={cancelling || processing}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-xs rounded-xl transition-colors border border-slate-200 hover:border-red-200 disabled:opacity-50"
              >
                {cancelling ? (
                  <span>Releasing slot hold...</span>
                ) : (
                  <span>Cancel Booking & Release Time Slot</span>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-surface-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit encrypted checkout • Instant QR booking pass</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Reservation Summary</h2>

            {/* Spot Details */}
            <div className="pb-4 border-b border-surface-100">
              <h3 className="font-bold text-surface-900 text-base">{booking.parkingSpace?.title}</h3>
              <p className="text-xs text-surface-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                {booking.parkingSpace?.address}, {booking.parkingSpace?.city}
              </p>
            </div>

            {/* Time and Vehicle */}
            <div className="py-4 border-b border-surface-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Start:
                </span>
                <span className="font-semibold text-surface-800">{startFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> End:
                </span>
                <span className="font-semibold text-surface-800">{endFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Duration:</span>
                <span className="font-semibold text-surface-800">{booking.duration} hours</span>
              </div>
              {booking.vehicle && (
                <div className="flex justify-between pt-1">
                  <span className="text-surface-500 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> Vehicle:
                  </span>
                  <span className="font-semibold text-surface-800">
                    {booking.vehicle.vehicleNumber} ({booking.vehicle.model || booking.vehicle.vehicleType})
                  </span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-surface-600">
                <span>Base Parking Fee</span>
                <span>₹{booking.basePrice}</span>
              </div>
              <div className="flex justify-between text-surface-600">
                <span>Platform Service Fee</span>
                <span>₹{booking.platformFee}</span>
              </div>
              <div className="flex justify-between text-surface-600">
                <span>Applicable Taxes (GST)</span>
                <span>₹{booking.tax}</span>
              </div>
              <div className="pt-3 border-t border-surface-200 flex justify-between items-center text-sm font-bold text-surface-900">
                <span>Total Due</span>
                <span className="text-xl font-black text-primary-600">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
