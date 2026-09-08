import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const PARKING_TYPES = [
  'Home Driveway', 'Garage', 'Apartment', 'Society', 'Private Plot', 'Commercial',
];

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Hatchback', 'Sedan', 'SUV', 'EV'];

const SearchFilters = ({ filters, onFilterChange, onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      parkingType: '',
      vehicleType: '',
      minPrice: '',
      maxPrice: '',
      covered: false,
      cctv: false,
      evCharging: false,
    });
    onSearch();
  };

  const hasActiveFilters =
    filters.parkingType || filters.vehicleType || filters.minPrice ||
    filters.maxPrice || filters.covered || filters.cctv || filters.evCharging;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-700" />
          <input
            type="text"
            placeholder="Search by location, title..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/25 transition-all"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 border rounded-xl transition-all ${
            showFilters || hasActiveFilters
              ? 'border-primary-300 bg-primary-50 text-primary-600'
              : 'border-surface-200 text-surface-700 hover:bg-surface-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </form>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-lg shadow-surface-900/5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Parking Type */}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Parking Type</label>
              <select
                value={filters.parkingType || ''}
                onChange={(e) => handleInputChange('parkingType', e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              >
                <option value="">All Types</option>
                {PARKING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Vehicle Type</label>
              <select
                value={filters.vehicleType || ''}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              >
                <option value="">All Vehicles</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Min Price (₹/hr)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => handleInputChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Max Price (₹/hr)</label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={filters.maxPrice || ''}
                onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              />
            </div>
          </div>

          {/* Amenity Checkboxes */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { key: 'covered', label: 'Covered' },
              { key: 'cctv', label: 'CCTV' },
              { key: 'evCharging', label: 'EV Charging' },
            ].map((a) => (
              <label key={a.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!filters[a.key]}
                  onChange={(e) => handleInputChange(a.key, e.target.checked)}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-800">{a.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={onSearch}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
