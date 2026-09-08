import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Shield,
  Zap,
  Car,
  Clock,
  Calendar,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Info,
  ShieldCheck,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { getParkingById } from '../../services/parkingService';
import { toggleFavorite, checkIsFavorite } from '../../services/favoriteService';
import { getParkingReviews } from '../../services/reviewService';
import { getDemandForecast } from '../../services/smartService';
import ParkingMap from '../../components/ParkingMap';
import useAuth from '../../hooks/useAuth';

const ParkingDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [demandInfo, setDemandInfo] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, reviewsRes] = await Promise.all([
          getParkingById(id),
          getParkingReviews(id).catch(() => ({ success: false })),
        ]);
        if (res.success) {
          const p = res.data?.parking || res.data;
          setParking(p);
          getDemandForecast({ city: p.city, spotId: id })
            .then((dfRes) => {
              if (dfRes.success) setDemandInfo(dfRes.data);
            })
            .catch(() => {});
        }
        if (reviewsRes.success) {
          setReviews(reviewsRes.data?.reviews || []);
        }

        if (isAuthenticated) {
          checkIsFavorite(id)
            .then((favRes) => {
              if (favRes.success) setIsFav(favRes.data.isFavorite);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Error fetching parking details:', err);
        setError(err.response?.data?.message || 'Failed to load parking spot details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, isAuthenticated]);

  const handleToggleFav = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await toggleFavorite(id);
      if (res.success) {
        setIsFav(res.data.isFavorite);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-surface-700">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Loading parking details...</p>
      </div>
    );
  }

  if (error || !parking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Parking Spot Not Found</h2>
        <p className="text-surface-700 text-sm mb-6">{error || 'This listing may have been removed or unpublished.'}</p>
        <Link
          to="/parking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Browse Parking
        </Link>
      </div>
    );
  }

  const photos = parking.photos && parking.photos.length > 0 ? parking.photos : [];
  const currentPhoto = photos[selectedPhotoIndex] || null;

  const amenities = [
    { label: 'Covered Parking', active: parking.covered, icon: Shield },
    { label: 'Security Guard', active: parking.security, icon: Shield },
    { label: 'CCTV Surveillance', active: parking.cctv, icon: Shield },
    { label: 'EV Charging Station', active: parking.evCharging, icon: Zap },
    { label: 'Gated Access', active: parking.gateAccess, icon: CheckCircle2 },
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar: Back Link & Favorite Toggle */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/parking"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to search results
        </Link>

        {isAuthenticated && (
          <button
            onClick={handleToggleFav}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isFav
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-surface-200 text-surface-700 hover:bg-surface-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isFav ? 'Saved in Wishlist' : 'Save Spot'}</span>
          </button>
        )}
      </div>

      {/* Live Demand Forecast Banner */}
      {demandInfo && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            demandInfo.demandLevel === 'HIGH'
              ? 'bg-gradient-to-r from-rose-50/90 to-amber-50/70 border-rose-200 text-rose-950'
              : demandInfo.demandLevel === 'MEDIUM'
              ? 'bg-gradient-to-r from-amber-50/90 to-yellow-50/70 border-amber-200 text-amber-950'
              : 'bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-xl">
              {demandInfo.demandLevel === 'HIGH'
                ? '🔥'
                : demandInfo.demandLevel === 'MEDIUM'
                ? '⚡'
                : '🟢'}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {demandInfo.demandLevel === 'HIGH'
                  ? 'HIGH DEMAND AREA'
                  : demandInfo.demandLevel === 'MEDIUM'
                  ? 'MODERATE DEMAND'
                  : 'STEADY DEMAND'}
              </p>
              <p className="text-xs text-surface-700 mt-0.5">{demandInfo.insight}</p>
            </div>
          </div>
          {demandInfo.peakHours?.[1] && (
            <span className="px-2.5 py-1 bg-white border border-surface-200 text-surface-800 text-[11px] font-semibold rounded-lg self-start sm:self-auto shrink-0 shadow-xs">
              Peak Hours: {demandInfo.peakHours[1]}
            </span>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Photos, Overview, Details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo Gallery */}
          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
            <div className="relative h-72 sm:h-96 bg-surface-100 flex items-center justify-center overflow-hidden">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={parking.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="text-center p-8 text-surface-700">
                  <Car className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No photos uploaded for this spot</p>
                </div>
              )}
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-surface-900 rounded-lg shadow-sm">
                  {parking.parkingType}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-lg backdrop-blur-md ${
                    parking.status === 'active'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                  }`}
                >
                  {parking.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="p-3 bg-surface-50 border-t border-surface-200 flex gap-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      selectedPhotoIndex === index
                        ? 'border-primary-600 ring-2 ring-primary-500/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title and Header Info */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900">
                {parking.title}
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl self-start">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-900">
                  {parking.rating > 0 ? parking.rating.toFixed(1) : 'New'}
                </span>
                <span className="text-xs text-amber-700">({parking.totalReviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-surface-700 text-sm mb-6">
              <MapPin className="w-4 h-4 shrink-0 text-primary-600" />
              <span>{parking.address}, {parking.city}</span>
            </div>

            <hr className="border-surface-100 my-6" />

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-surface-900">About this spot</h2>
              <p className="text-surface-700 text-sm leading-relaxed whitespace-pre-line">
                {parking.description || 'No additional description provided.'}
              </p>
            </div>
          </div>

          {/* Vehicle Compatibility */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Supported Vehicles</h2>
            <div className="flex flex-wrap gap-2">
              {parking.vehicleTypes && parking.vehicleTypes.length > 0 ? (
                parking.vehicleTypes.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-100 text-surface-800 rounded-xl text-sm font-medium border border-surface-200"
                  >
                    <Car className="w-4 h-4 text-primary-600" />
                    {v}
                  </span>
                ))
              ) : (
                <p className="text-sm text-surface-700">All standard vehicles allowed.</p>
              )}
            </div>
          </div>

          {/* Amenities & Security */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Amenities & Security Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenities.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                    item.active
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-surface-50 border-surface-200/60 text-surface-700/60'
                  }`}
                >
                  {item.active ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-surface-700 shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${item.active ? 'text-emerald-950 font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Availability */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-surface-900">Operating Schedule</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-700 mb-2">
                  Operating Days
                </p>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isAvailable = parking.availability?.days?.includes(day);
                    return (
                      <span
                        key={day}
                        className={`px-3 py-1.5 text-xs font-medium rounded-xl border ${
                          isAvailable
                            ? 'bg-primary-50 border-primary-300 text-primary-700 font-semibold'
                            : 'bg-surface-50 border-surface-200 text-surface-700/50'
                        }`}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Clock className="w-4 h-4 text-surface-700" />
                <span className="text-sm text-surface-800">
                  Operating Hours:{' '}
                  <strong className="text-surface-900">
                    {parking.availability?.startTime || '08:00'} - {parking.availability?.endTime || '18:00'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Parking Rules */}
          {parking.rules && parking.rules.length > 0 && (
            <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-surface-900 mb-4">Host Rules & Guidelines</h2>
              <ul className="space-y-2.5">
                {parking.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-surface-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Spot Location Map */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-2">Location</h2>
            <p className="text-sm text-surface-700 mb-4">
              Exact location will be shared in your confirmation receipt.
            </p>
            <div className="h-80 rounded-2xl overflow-hidden border border-surface-200">
              <ParkingMap parkingSpaces={[parking]} className="h-full w-full" />
            </div>
          </div>

          {/* Community Reviews & Ratings */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Customer Reviews
                </h2>
                <p className="text-xs text-surface-600 mt-0.5">
                  Verified ratings from drivers who parked here.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-sm font-extrabold">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{parking.rating > 0 ? parking.rating.toFixed(1) : 'New'}</span>
                <span className="text-xs font-normal text-surface-500">
                  ({parking.totalReviews || 0})
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-surface-500 py-4 text-center">
                No reviews yet for this spot. Be the first to review after completing your booking!
              </p>
            ) : (
              <div className="space-y-3 divide-y divide-surface-100">
                {reviews.map((r) => (
                  <div key={r._id} className="pt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-surface-900">{r.user?.name || 'Driver'}</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-surface-600 italic">"{r.comment}"</p>
                    <div className="text-[10px] text-surface-400 flex justify-between pt-1">
                      <span>
                        Safety: {r.safetyRating}★ • Cleanliness: {r.cleanlinessRating}★ • Location: {r.locationRating}★
                      </span>
                      <span>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Pricing Card & Host Info) */}
        <div className="space-y-6">
          {/* Booking & Pricing Card */}
          <div className="sticky top-24 bg-white rounded-3xl border border-surface-200 p-6 shadow-xl shadow-surface-900/5 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-surface-700">
                Rate Breakdown
              </span>
              <div className="mt-2 space-y-2">
                {parking.pricePerHour > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-surface-700">Hourly</span>
                    <span className="text-2xl font-extrabold text-surface-900">
                      ₹{parking.pricePerHour}
                      <span className="text-xs font-normal text-surface-700">/hr</span>
                    </span>
                  </div>
                )}
                {parking.pricePerDay > 0 && (
                  <div className="flex items-baseline justify-between border-t border-surface-100 pt-2">
                    <span className="text-sm text-surface-700">Daily</span>
                    <span className="text-lg font-bold text-surface-800">
                      ₹{parking.pricePerDay}
                      <span className="text-xs font-normal text-surface-700">/day</span>
                    </span>
                  </div>
                )}
                {parking.pricePerMonth > 0 && (
                  <div className="flex items-baseline justify-between border-t border-surface-100 pt-2">
                    <span className="text-sm text-surface-700">Monthly Pass</span>
                    <span className="text-lg font-bold text-surface-800">
                      ₹{parking.pricePerMonth}
                      <span className="text-xs font-normal text-surface-700">/mo</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-950">Guaranteed Slot Reservation</p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Instant confirmation with automated overlap protection and clear schedule breakdown.
                </p>
              </div>
            </div>

            {/* Active Book Spot Button */}
            <Link
              to={`/booking/${parking._id}`}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>Book This Spot</span>
              <span>→</span>
            </Link>

            <p className="text-center text-xs text-surface-700">
              Free cancellation anytime before arrival
            </p>

            {/* Host Profile Card */}
            {parking.host && (
              <div className="border-t border-surface-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 mb-3">
                  Listed By Host
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {parking.host.name ? parking.host.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-surface-900 truncate">{parking.host.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {parking.host.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          ✓ Verified Host
                        </span>
                      ) : (
                        <span className="text-xs text-surface-500">ParkShare Host</span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        Reliability: {parking.host.reliabilityScore !== undefined ? parking.host.reliabilityScore : 100}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-surface-700">
                  {parking.host.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-surface-700" />
                      <span className="truncate">{parking.host.email}</span>
                    </div>
                  )}
                  {parking.host.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-surface-700" />
                      <span>{parking.host.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetails;
