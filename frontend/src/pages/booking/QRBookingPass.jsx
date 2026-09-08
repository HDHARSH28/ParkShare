import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  QrCode,
  Download,
  Printer,
  Calendar,
  Clock,
  Car,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { getBookingById } from '../../services/bookingService';

const QRBookingPass = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getBookingById(id);
      if (res.success) {
        setBooking(res.data.booking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking pass');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!booking?.qrCode) return;
    const link = document.createElement('a');
    link.href = booking.qrCode;
    link.download = `parkshare-pass-${booking._id.slice(-6).toUpperCase()}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ParkShare Pass - ${booking.parkingSpace?.title}`,
          text: `Here is my ParkShare parking pass for ${booking.parkingSpace?.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled or error:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-surface-900 mb-2">Pass Not Found</h2>
        <p className="text-surface-600 mb-6">{error || 'Unable to retrieve parking pass.'}</p>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // If unpaid, direct to payment
  if (booking.paymentStatus !== 'PAID') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-amber-200 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-surface-900 mb-2">Payment Required</h2>
        <p className="text-surface-600 mb-6">
          Your QR Entry Pass is generated only after payment is completed.
        </p>
        <Link
          to={`/payment/${booking._id}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition"
        >
          Complete Payment (₹{booking.totalAmount})
        </Link>
      </div>
    );
  }

  const passCode = `PARK-${booking._id.slice(-6).toUpperCase()}`;
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            CHECKED-IN • ACTIVE
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-200 text-surface-700 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-surface-500" />
            COMPLETED
          </span>
        );
      case 'CONFIRMED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            CONFIRMED
          </span>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to={`/bookings/${booking._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-600 hover:text-surface-900 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Booking Details</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition"
            title="Share or Copy Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition"
            title="Print Pass"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copied && (
        <div className="mb-3 py-1.5 px-3 bg-surface-900 text-white text-xs rounded-lg text-center font-medium animate-fade-in">
          Link copied to clipboard!
        </div>
      )}

      {/* Main Digital Pass Ticket Card */}
      <div className="bg-white rounded-3xl border-2 border-surface-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase opacity-90">
              ParkShare Entry Pass
            </span>
            {getStatusBadge()}
          </div>
          <h1 className="text-xl font-bold truncate">{booking.parkingSpace?.title}</h1>
          <p className="text-xs text-primary-100 mt-1 truncate">
            {booking.parkingSpace?.address}, {booking.parkingSpace?.city}
          </p>
        </div>

        {/* QR Code Section (Centerpiece, ultra clear on mobile) */}
        <div className="p-6 bg-surface-50/50 flex flex-col items-center justify-center border-b border-dashed border-surface-300 relative">
          {/* Ticket cutout circles */}
          <div className="absolute -left-3.5 -bottom-3.5 w-7 h-7 bg-surface-100 rounded-full border border-surface-200" />
          <div className="absolute -right-3.5 -bottom-3.5 w-7 h-7 bg-surface-100 rounded-full border border-surface-200" />

          <div className="p-3 bg-white rounded-2xl shadow-md border border-surface-200">
            {booking.qrCode ? (
              <img
                src={booking.qrCode}
                alt="Parking Entry QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-surface-100 rounded-lg text-surface-400">
                <QrCode className="w-16 h-16" />
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-surface-600 uppercase tracking-wider block">
              Pass Identifier
            </span>
            <span className="font-mono font-extrabold text-2xl text-surface-900 tracking-wider">
              {passCode}
            </span>
          </div>
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-4 text-xs">
          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-surface-100">
            <div>
              <span className="text-surface-600 block">Date</span>
              <span className="font-bold text-surface-800 text-sm">
                {startDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-surface-600 block">Duration</span>
              <span className="font-bold text-surface-800 text-sm">{booking.duration} Hours</span>
            </div>
            <div>
              <span className="text-surface-600 block">Check-in Window</span>
              <span className="font-semibold text-surface-800">
                {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-surface-600 block">Check-out Window</span>
              <span className="font-semibold text-surface-800">
                {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Vehicle & Payment */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-surface-100">
            <div>
              <span className="text-surface-600 block">Vehicle</span>
              <span className="font-bold text-surface-800 text-sm">
                {booking.vehicle?.vehicleNumber || 'N/A'}
              </span>
              <span className="text-surface-600 text-[11px] block truncate">
                {booking.vehicle?.model}
              </span>
            </div>
            <div>
              <span className="text-surface-600 block">Amount Paid</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                ₹{booking.totalAmount}
              </span>
              <span className="text-emerald-700 text-[11px] block font-medium">
                ✓ Verified Payment
              </span>
            </div>
          </div>

          {/* Live Check-In / Check-Out Timestamps */}
          {(booking.checkInTime || booking.checkOutTime) && (
            <div className="p-3 bg-surface-50 rounded-xl space-y-1.5 text-[11px]">
              {booking.checkInTime && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Checked In:</span>
                  <span>{new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {booking.checkOutTime && (
                <div className="flex justify-between text-surface-600">
                  <span>Checked Out:</span>
                  <span>{new Date(booking.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="pt-2 text-surface-600 text-[11px] space-y-1">
            <p className="font-semibold text-surface-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary-600" />
              Check-In Instructions:
            </p>
            <p>
              1. Show this QR screen to the parking host upon your arrival.
            </p>
            <p>
              2. Host scans the code to mark your check-in.
            </p>
            <p>
              3. Scan again when leaving to complete your session.
            </p>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="bg-surface-50 px-6 py-3 border-t border-surface-100 flex items-center justify-between text-[11px] text-surface-600">
          <div className="flex items-center gap-1 text-primary-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Token Pass</span>
          </div>
          <span>Transaction Ref: {booking.transactionId || booking.razorpayPaymentId || 'Verified'}</span>
        </div>
      </div>

      {/* Quick Mobile Action Buttons */}
      <div className="mt-4 flex gap-3 print:hidden">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 px-4 bg-white hover:bg-surface-50 border border-surface-200 text-surface-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Download className="w-4 h-4 text-primary-600" />
          <span>Save to Photos</span>
        </button>
        <Link
          to={`/bookings/${booking._id}`}
          className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <span>View Full Booking</span>
        </Link>
      </div>
    </div>
  );
};

export default QRBookingPass;
