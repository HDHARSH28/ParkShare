import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Shield, Zap, Car, Heart, ShieldCheck } from 'lucide-react';
import { toggleFavorite, checkIsFavorite } from '../services/favoriteService';
import useAuth from '../hooks/useAuth';

const ParkingCard = ({ parking, onFavoriteToggle }) => {
  const { isAuthenticated } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const photo = parking.photos?.[0] || null;
  const host = parking.host;
  const reliability = host?.reliabilityScore !== undefined ? host.reliabilityScore : 100;
  const isVerified = host?.isVerified || false;

  useEffect(() => {
    if (isAuthenticated && parking?._id) {
      checkIsFavorite(parking._id)
        .then((res) => {
          if (res.success) setIsFav(res.data.isFavorite);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, parking?._id]);

  const handleHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      setFavLoading(true);
      const res = await toggleFavorite(parking._id);
      if (res.success) {
        setIsFav(res.data.isFavorite);
        if (onFavoriteToggle) onFavoriteToggle(parking._id, res.data.isFavorite);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-surface-100 to-surface-200 overflow-hidden">
        <Link to={`/parking/${parking._id}`} className="block w-full h-full cursor-pointer" title={parking.title}>
          {photo ? (
            <img
              src={photo}
              alt={parking.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-12 h-12 text-surface-700/40" />
            </div>
          )}
        </Link>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start pointer-events-none">
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/95 backdrop-blur-sm text-surface-800 rounded-lg shadow-sm">
            {parking.parkingType}
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-md shadow-sm">
              ✓ Verified Host
            </span>
          )}
        </div>

        {/* Top Right: Favorite & Amenities */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {isAuthenticated && (
            <button
              onClick={handleHeartClick}
              disabled={favLoading}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm transition hover:scale-110 ${
                isFav
                  ? 'bg-white text-red-500'
                  : 'bg-white/80 text-surface-600 hover:text-red-500'
              }`}
              title={isFav ? 'Remove from saved' : 'Save parking'}
            >
              <Heart
                className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
          )}

          {parking.covered && (
            <span className="px-2 py-1 text-xs font-semibold bg-primary-500/90 backdrop-blur-sm text-white rounded-lg pointer-events-none">
              Covered
            </span>
          )}
          {parking.evCharging && (
            <span className="p-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-lg pointer-events-none">
              <Zap className="w-3 h-3 text-white" />
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <Link to={`/parking/${parking._id}`} className="block group/title">
          <h3 className="text-lg font-semibold text-surface-900 line-clamp-1 group-hover/title:text-primary-600 group-hover:text-primary-600 transition-colors cursor-pointer">
            {parking.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mt-1 text-surface-700">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-600" />
          <span className="text-sm line-clamp-1">{parking.address}, {parking.city}</span>
        </div>

        {/* Trust & Reliability Score */}
        <div className="mt-2.5 flex items-center justify-between flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-bold rounded-md">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            Reliability: {reliability}%
          </span>
          {parking.recommendationScore !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-900 text-[11px] font-bold rounded-md shadow-xs">
              ✨ {parking.recommendationScore}% Match
            </span>
          )}
        </div>

        {/* AI Match Reasons & Highlights */}
        {parking.matchReasons && parking.matchReasons.length > 0 && (
          <div className="mt-2 text-[11px] text-surface-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="line-clamp-1 font-medium text-emerald-900 bg-emerald-50/80 px-1.5 py-0.5 rounded">
              {parking.matchReasons[0]}
            </span>
            {parking.distanceKm !== null && parking.distanceKm !== undefined && (
              <span className="text-primary-700 font-semibold ml-auto shrink-0">
                {parking.distanceKm} km
              </span>
            )}
          </div>
        )}

        {/* Rating + Reviews */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-surface-900">
              {parking.rating > 0 ? parking.rating.toFixed(1) : 'New'}
            </span>
          </div>
          {parking.totalReviews > 0 && (
            <span className="text-xs text-surface-700">({parking.totalReviews} reviews)</span>
          )}
          {parking.matchTag && (
            <span className="ml-auto px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
              {parking.matchTag}
            </span>
          )}
          {parking.security && !parking.matchTag && (
            <div className="ml-auto flex items-center gap-1 text-emerald-600">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Secured</span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-surface-100">
          <div>
            {parking.pricePerHour > 0 && (
              <p className="text-xl font-bold text-surface-900">
                ₹{parking.pricePerHour}<span className="text-sm font-normal text-surface-700">/hr</span>
              </p>
            )}
            {parking.pricePerHour === 0 && parking.pricePerDay > 0 && (
              <p className="text-xl font-bold text-surface-900">
                ₹{parking.pricePerDay}<span className="text-sm font-normal text-surface-700">/day</span>
              </p>
            )}
          </div>
          <Link
            to={`/parking/${parking._id}`}
            className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
          >
            View Parking
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParkingCard;
