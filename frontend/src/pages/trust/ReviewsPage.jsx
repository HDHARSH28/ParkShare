import { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Car,
  MessageSquare,
  ArrowRight,
  Send,
} from 'lucide-react';
import { getMyReviews, createReview } from '../../services/reviewService';

const StarPicker = ({ value, onChange, label, icon: Icon }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary-600" />}
        <span className="text-xs font-semibold text-surface-800">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-surface-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const ReviewsPage = () => {
  const [reviewsGiven, setReviewsGiven] = useState([]);
  const [unreviewedBookings, setUnreviewedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected booking to review
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [locationRating, setLocationRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyReviews();
      if (res.success) {
        setReviewsGiven(res.data.reviewsGiven || []);
        setUnreviewedBookings(res.data.unreviewedBookings || []);
        if (res.data.unreviewedBookings?.length > 0 && !selectedBooking) {
          setSelectedBooking(res.data.unreviewedBookings[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const res = await createReview({
        bookingId: selectedBooking._id,
        rating,
        safetyRating,
        cleanlinessRating,
        locationRating,
        comment,
      });

      if (res.success) {
        setSuccessMsg('Review and ratings submitted successfully! Thank you for your feedback.');
        setSelectedBooking(null);
        setComment('');
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold mb-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          Community Ratings & Reviews
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Ratings & Reviews</h1>
        <p className="text-surface-600 text-xs sm:text-sm mt-1">
          Share your experience with parking spots and help fellow drivers find safe, clean spaces.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Write Review Section (If user has completed unreviewed bookings) */}
      {unreviewedBookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-surface-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Review a Completed Parking Slot
              </h2>
              <p className="text-xs text-surface-600 mt-0.5">
                Select from your recently completed parking reservations.
              </p>
            </div>

            {/* Selector if multiple */}
            {unreviewedBookings.length > 1 && (
              <select
                value={selectedBooking?._id}
                onChange={(e) => {
                  const b = unreviewedBookings.find((x) => x._id === e.target.value);
                  setSelectedBooking(b);
                }}
                className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold text-surface-700 focus:outline-none"
              >
                {unreviewedBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.parkingSpace?.title} ({new Date(b.startTime).toLocaleDateString('en-IN')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBooking && (
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Selected Booking Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
                {selectedBooking.parkingSpace?.photos?.[0] ? (
                  <img
                    src={selectedBooking.parkingSpace.photos[0]}
                    alt={selectedBooking.parkingSpace.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-200 flex items-center justify-center text-surface-400">
                    <Car className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">
                    {selectedBooking.parkingSpace?.title}
                  </h3>
                  <p className="text-xs text-surface-600">{selectedBooking.parkingSpace?.address}</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    Completed on {new Date(selectedBooking.endTime).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Star Rating Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StarPicker
                  label="Overall Experience"
                  value={rating}
                  onChange={setRating}
                  icon={Star}
                />
                <StarPicker
                  label="Safety & Security"
                  value={safetyRating}
                  onChange={setSafetyRating}
                  icon={ShieldCheck}
                />
                <StarPicker
                  label="Cleanliness & Space"
                  value={cleanlinessRating}
                  onChange={setCleanlinessRating}
                  icon={Sparkles}
                />
                <StarPicker
                  label="Ease of Location & Entry"
                  value={locationRating}
                  onChange={setLocationRating}
                  icon={MapPin}
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Your Review & Comments
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about gate access, host hospitality, vehicle safety, etc."
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Review...' : 'Publish Rating & Review'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* My Submitted Reviews History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Your Submitted Reviews ({reviewsGiven.length})
        </h2>

        {reviewsGiven.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-surface-200 shadow-sm text-surface-500 text-xs">
            You haven't written any parking reviews yet. Reviews can be submitted after completing a booking.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsGiven.map((rev) => (
              <div
                key={rev._id}
                className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-surface-900 text-sm">
                      {rev.parkingSpace?.title || 'Parking Spot'}
                    </h3>
                    <p className="text-xs text-surface-500">{rev.parkingSpace?.city}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-surface-700 italic">"{rev.comment}"</p>

                <div className="flex items-center justify-between text-[11px] text-surface-500 pt-2 border-t border-surface-100">
                  <span>
                    Safety: {rev.safetyRating}★ • Clean: {rev.cleanlinessRating}★ • Loc:{' '}
                    {rev.locationRating}★
                  </span>
                  <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
