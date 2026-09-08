import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Car,
  MapPin,
  Star,
  ShieldCheck,
  ArrowRight,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { getMyFavorites, toggleFavorite } from '../../services/favoriteService';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyFavorites();
      if (res.success) {
        setFavorites(res.data.favorites || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load favorite spots');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (parkingId) => {
    try {
      await toggleFavorite(parkingId);
      setFavorites((prev) => prev.filter((f) => f.parkingSpace._id !== parkingId));
    } catch (err) {
      console.error(err);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold mb-1">
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            Personal Wishlist
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Saved Parking Spots</h1>
          <p className="text-xs text-surface-600 mt-0.5">
            Quickly book recurring slots at your favorite parking locations.
          </p>
        </div>

        <Link
          to="/parking"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-semibold transition"
        >
          <span>Browse More Spots</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-surface-200 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-400">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-surface-900 text-base">No Saved Parking Spots Yet</h3>
          <p className="text-xs text-surface-600 max-w-sm mx-auto">
            Click the heart icon on any parking space in the browse marketplace to save it here for
            quick access.
          </p>
          <div className="pt-2">
            <Link
              to="/parking"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              Explore Parking Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const spot = fav.parkingSpace;
            const host = spot.host;
            return (
              <div
                key={fav._id}
                className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-video bg-surface-100 overflow-hidden">
                  <Link to={`/parking/${spot._id}`} className="block w-full h-full cursor-pointer">
                    {spot.photos?.[0] ? (
                      <img
                        src={spot.photos[0]}
                        alt={spot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-400">
                        <Car className="w-10 h-10" />
                      </div>
                    )}
                  </Link>

                  {/* Remove Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(spot._id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-600 rounded-full shadow-sm hover:scale-110 transition z-10"
                    title="Remove from saved"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>

                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-surface-900/80 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg pointer-events-none">
                    {spot.parkingType}
                  </span>
                </div>

                {/* Spot Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Link to={`/parking/${spot._id}`} className="block max-w-[75%] hover:text-primary-600 transition-colors">
                        <h3 className="font-bold text-surface-900 text-base truncate cursor-pointer hover:text-primary-600 transition-colors">{spot.title}</h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs font-bold text-surface-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{spot.rating > 0 ? spot.rating : 'New'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-surface-600 flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      {spot.address}, {spot.city}
                    </p>

                    {/* Host Trust Badges */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {host?.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold">
                          ✓ Verified Host
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        Reliability: {host?.reliabilityScore || 100}%
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-surface-900">
                        ₹{spot.pricePerHour}
                      </span>
                      <span className="text-[11px] text-surface-500"> / hr</span>
                    </div>

                    <Link
                      to={`/booking/${spot._id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Book Spot
                    </Link>
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

export default FavoritesPage;
