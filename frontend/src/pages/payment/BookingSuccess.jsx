import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  QrCode,
  Calendar,
  Clock,
  Car,
  MapPin,
  ArrowRight,
  Download,
  Share2,
  FileText,
} from 'lucide-react';
import { getBookingById } from '../../services/bookingService';

const BookingSuccess = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      getBookingById(bookingId)
        .then((res) => {
          if (res.success) setBooking(res.data.booking);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const code = booking ? `PARK-${booking._id.slice(-6).toUpperCase()}` : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden text-center p-8 sm:p-10">
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>

        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          Payment Verified • Slot Confirmed
        </span>

        <h1 className="text-3xl font-extrabold text-surface-900">
          Booking Confirmed!
        </h1>
        <p className="text-surface-600 mt-2 max-w-md mx-auto text-sm">
          Your payment was processed successfully. Your parking spot is secured and your QR Entry Pass has been generated.
        </p>

        {/* Pass preview card */}
        {booking && (
          <div className="mt-8 bg-surface-50 border border-surface-200 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div>
                <span className="text-xs text-surface-600">Booking Pass Code</span>
                <p className="font-mono font-bold text-lg text-primary-700 tracking-wider">
                  {code}
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                PAID ₹{booking.totalAmount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-surface-800">{booking.parkingSpace?.title}</p>
                  <p className="text-surface-600 text-[11px] truncate">{booking.parkingSpace?.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-surface-800">{booking.vehicle?.model || 'Vehicle'}</p>
                  <p className="text-surface-600 font-mono text-[11px]">{booking.vehicle?.vehicleNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:col-span-2 pt-2 border-t border-surface-200">
                <Clock className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-surface-800">
                    {new Date(booking.startTime).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-surface-600 text-[11px]">
                    {new Date(booking.startTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    —{' '}
                    {new Date(booking.endTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({booking.duration} Hours)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {booking && (
            <Link
              to={`/booking/${booking._id}/qr`}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-700 hover:to-indigo-700 transition group"
            >
              <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Open QR Entry Pass</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {booking && (
              <Link
                to={`/bookings/${booking._id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-surface-700 font-medium rounded-xl border border-surface-200 hover:bg-surface-50 transition text-sm"
              >
                <FileText className="w-4 h-4 text-surface-600" />
                <span>View Receipt</span>
              </Link>
            )}
            <Link
              to="/bookings"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition text-sm"
            >
              My Bookings
            </Link>
          </div>
        </div>

        <p className="text-xs text-surface-600 mt-6">
          A copy of your booking pass has been saved to your account. Simply present the QR code to the host upon check-in.
        </p>
      </div>
    </div>
  );
};

export default BookingSuccess;
