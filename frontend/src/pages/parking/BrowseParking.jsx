import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map, Loader2, AlertCircle, Compass, Navigation, X } from 'lucide-react';
import { getAllParking } from '../../services/parkingService';
import ParkingCard from '../../components/ParkingCard';
import ParkingMap from '../../components/ParkingMap';
import SearchFilters from '../../components/SearchFilters';

const BrowseParking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Initial filter state from URL search params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    parkingType: searchParams.get('parkingType') || '',
    vehicleType: searchParams.get('vehicleType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    covered: searchParams.get('covered') === 'true',
    cctv: searchParams.get('cctv') === 'true',
    evCharging: searchParams.get('evCharging') === 'true',
  });
  const [sortBy, setSortBy] = useState('recommended');

  const [userLocation, setUserLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const fetchParking = useCallback(async (customFilters = filters, page = 1, currentSort = sortBy) => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 12, sort: currentSort };
      if (customFilters.search) params.search = customFilters.search;
      if (customFilters.parkingType) params.parkingType = customFilters.parkingType;
      if (customFilters.vehicleType) params.vehicleType = customFilters.vehicleType;
      if (customFilters.minPrice) params.minPrice = customFilters.minPrice;
      if (customFilters.maxPrice) params.maxPrice = customFilters.maxPrice;
      if (customFilters.covered) params.covered = 'true';
      if (customFilters.cctv) params.cctv = 'true';
      if (customFilters.evCharging) params.evCharging = 'true';

      // Pass user coordinates if detected
      if (customFilters.userLat && customFilters.userLng) {
        params.userLat = customFilters.userLat;
        params.userLng = customFilters.userLng;
      } else if (userLocation?.lat && userLocation?.lng) {
        params.userLat = userLocation.lat;
        params.userLng = userLocation.lng;
      }

      const res = await getAllParking(params);
      if (res.success) {
        setParkingSpaces(res.data.parkingSpaces || []);
        setPagination({
          page: res.data.page || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching parking:', err);
      setError(err.response?.data?.message || 'Failed to load parking spaces');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, userLocation]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setUserLocation(loc);
        setDetectingLocation(false);
        fetchParking({ ...filters, userLat: loc.lat, userLng: loc.lng }, 1);
      },
      (err) => {
        setDetectingLocation(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setError('Location permission denied. Please allow location access in your browser settings.');
        } else if (err.code === 2) {
          setError('Location position unavailable. Please check your GPS/internet connection.');
        } else {
          setError('Location request timed out. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    const updated = { ...filters };
    delete updated.userLat;
    delete updated.userLng;
    fetchParking(updated, 1);
  };

  useEffect(() => {
    fetchParking(filters, 1, sortBy);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Sync to URL
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    setSearchParams(params);
    fetchParking(filters, 1);
  };

  const handlePageChange = (newPage) => {
    fetchParking(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Find Parking
          </h1>
          <p className="text-surface-700 text-sm mt-1">
            Discover verified private and commercial parking spots nearby
          </p>
        </div>

        {/* Header Controls: Detect Location & View Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Detect Location Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
              userLocation
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-surface-200 hover:border-primary-300'
            }`}
          >
            {detectingLocation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-primary-600 animate-spin" />
                <span>Locating GPS...</span>
              </>
            ) : userLocation ? (
              <>
                <Navigation className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Near You {userLocation.accuracy ? `(±${userLocation.accuracy}m)` : ''}</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
                <span>Detect My Location</span>
              </>
            )}
          </button>

          {userLocation && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition border border-transparent hover:border-slate-200"
              title="Clear detected location"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Toggle */}
          <div className="inline-flex p-1 bg-surface-100 rounded-xl border border-surface-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-700 hover:text-surface-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-700 hover:text-surface-900'
              }`}
            >
              <Map className="w-4 h-4" />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-8">
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm font-medium text-surface-700">
          {loading ? (
            'Searching parking spaces...'
          ) : (
            <>
              Showing <span className="text-surface-900 font-semibold">{parkingSpaces.length}</span> of{' '}
              <span className="text-surface-900 font-semibold">{pagination.total}</span> available spots
            </>
          )}
        </p>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-surface-500 font-medium shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              const newSort = e.target.value;
              setSortBy(newSort);
              fetchParking(filters, 1, newSort);
            }}
            className="px-3 py-1.5 bg-white border border-surface-200 hover:border-surface-300 rounded-xl text-xs font-semibold text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer shadow-xs"
          >
            {userLocation && (
              <option value="distance">📍 Distance: Nearest to Me</option>
            )}
            <option value="recommended">✨ AI Best Match (Recommended)</option>
            <option value="-createdAt">Newest First</option>
            <option value="pricePerHour">Price: Low to High</option>
            <option value="-pricePerHour">Price: High to Low</option>
            <option value="-rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-700">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Finding available parking spots...</p>
        </div>
      ) : parkingSpaces.length === 0 ? (
        <div className="bg-white rounded-3xl border border-surface-200 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-surface-700">
            <Map className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">No parking spaces found</h3>
          <p className="text-sm text-surface-700 mb-6">
            Try adjusting your search terms, widening price limits, or clearing active filters.
          </p>
          <button
            onClick={() => {
              setFilters({
                search: '',
                parkingType: '',
                vehicleType: '',
                minPrice: '',
                maxPrice: '',
                covered: false,
                cctv: false,
                evCharging: false,
              });
              fetchParking({}, 1);
            }}
            className="px-5 py-2.5 bg-primary-50 text-primary-700 font-semibold rounded-xl text-sm hover:bg-primary-100 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingSpaces.map((space) => (
              <ParkingCard key={space._id} parking={space} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-4 py-2 border border-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-surface-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-4 py-2 border border-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="h-[650px] w-full">
          <ParkingMap
            parkingSpaces={parkingSpaces}
            userLocation={userLocation}
            onDetectLocation={handleDetectLocation}
            detectingLocation={detectingLocation}
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
};

export default BrowseParking;
