import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  MapPin,
  Car,
  Shield,
  Zap,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  Check,
  LocateFixed,
  Sparkles,
} from 'lucide-react';
import { createParking } from '../../services/parkingService';
import { getPriceRecommendation } from '../../services/smartService';

const PARKING_TYPES = [
  'Home Driveway',
  'Garage',
  'Apartment',
  'Society',
  'Private Plot',
  'Commercial',
];

const VEHICLE_OPTIONS = ['Bike', 'Scooter', 'Hatchback', 'Sedan', 'SUV', 'EV'];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
];

const PRESET_LOCATIONS = [
  { name: 'Mumbai (Bandra)', lat: 19.0596, lng: 72.8295, city: 'Mumbai' },
  { name: 'Bangalore (Indiranagar)', lat: 12.9784, lng: 77.6408, city: 'Bangalore' },
  { name: 'Delhi (Connaught Place)', lat: 28.6315, lng: 77.2167, city: 'Delhi' },
  { name: 'Pune (Kothrud)', lat: 18.5074, lng: 73.8077, city: 'Pune' },
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const AddParking = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    parkingType: 'Home Driveway',
    address: '',
    city: '',
    latitude: 18.5204,
    longitude: 73.8567,
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    covered: false,
    security: false,
    cctv: false,
    evCharging: false,
    gateAccess: false,
    pricePerHour: 30,
    pricePerDay: 200,
    pricePerMonth: 4000,
    status: 'active',
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '08:00',
      endTime: '19:00',
    },
    photos: [SAMPLE_PHOTOS[0]],
    rules: ['Park strictly within assigned boundary', 'Keep access gate closed after parking'],
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newRule, setNewRule] = useState('');
  const [smartPriceLoading, setSmartPriceLoading] = useState(false);
  const [smartPriceData, setSmartPriceData] = useState(null);

  const handleGetSmartPrice = async () => {
    try {
      setSmartPriceLoading(true);
      const res = await getPriceRecommendation({
        city: formData.city,
        lat: formData.latitude,
        lng: formData.longitude,
        parkingType: formData.parkingType,
        covered: formData.covered,
        cctv: formData.cctv,
        evCharging: formData.evCharging,
      });
      if (res.success) {
        setSmartPriceData(res.data);
      }
    } catch (err) {
      console.error('Failed to get price recommendation:', err);
    } finally {
      setSmartPriceLoading(false);
    }
  };

  const applySmartPrice = () => {
    if (!smartPriceData?.recommendedPricePerHour) return;
    const rec = smartPriceData.recommendedPricePerHour;
    setFormData((prev) => ({
      ...prev,
      pricePerHour: rec,
      pricePerDay: rec * 10,
      pricePerMonth: rec * 200,
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehicleToggle = (vehicle) => {
    setFormData((prev) => {
      const exists = prev.vehicleTypes.includes(vehicle);
      const updated = exists
        ? prev.vehicleTypes.filter((v) => v !== vehicle)
        : [...prev.vehicleTypes, vehicle];
      return { ...prev, vehicleTypes: updated };
    });
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const days = prev.availability.days || [];
      const updatedDays = days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day];
      return {
        ...prev,
        availability: { ...prev.availability, days: updatedDays },
      };
    });
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, newPhotoUrl.trim()],
    }));
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule.trim()],
    }));
    setNewRule('');
  };

  const handleRemoveRule = (index) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
          }));
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          setError('Could not retrieve current location. Please enter manually.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim()) {
      setError('Address and city are required');
      return;
    }
    if (!formData.pricePerHour && !formData.pricePerDay && !formData.pricePerMonth) {
      setError('Please set at least one price (hourly, daily, or monthly)');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createParking({
        ...formData,
        pricePerHour: Number(formData.pricePerHour) || 0,
        pricePerDay: Number(formData.pricePerDay) || 0,
        pricePerMonth: Number(formData.pricePerMonth) || 0,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });

      if (res.success) {
        navigate('/host/parking');
      }
    } catch (err) {
      console.error('Error creating parking:', err);
      setError(err.response?.data?.message || 'Failed to list parking spot. Please verify all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8">
        <Link
          to="/host/parking"
          className="inline-flex items-center gap-1 text-sm font-medium text-surface-700 hover:text-primary-600 mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to listings
        </Link>
        <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
          List a New Parking Space
        </h1>
        <p className="text-surface-700 text-sm mt-1">
          Provide accurate details about your parking space to attract verified drivers
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Basic Details */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-primary-600" />
            Basic Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Safe Covered Driveway near Metro Station"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Parking Type *
              </label>
              <select
                value={formData.parkingType}
                onChange={(e) => handleInputChange('parkingType', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              >
                {PARKING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Initial Listing Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              >
                <option value="active">Active (Published Immediately)</option>
                <option value="draft">Draft (Private / Not Public)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Description
              </label>
              <textarea
                rows="3"
                placeholder="Share access instructions, nearby landmarks, or special spot notes..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Location */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Location & Geodata
            </h2>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 p-1.5 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Detect My GPS
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 42 Hill Road, Bandra West"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                />
              </div>
            </div>

            {/* Quick city coordinates presets */}
            <div className="sm:col-span-2 pt-1">
              <span className="text-xs text-surface-700 mr-2">Quick Presets:</span>
              <div className="inline-flex flex-wrap gap-2 mt-1">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        city: preset.city,
                        latitude: preset.lat,
                        longitude: preset.lng,
                        address: prev.address || `${preset.name} Main Road`,
                      }));
                    }}
                    className="px-2.5 py-1 text-xs bg-surface-100 hover:bg-primary-50 hover:text-primary-700 rounded-lg text-surface-700 transition-colors border border-surface-200"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Vehicle Compatibility */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-surface-900">Allowed Vehicle Types</h2>
          <p className="text-xs text-surface-700">Select which vehicle sizes can comfortably fit</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VEHICLE_OPTIONS.map((v) => {
              const checked = formData.vehicleTypes.includes(v);
              return (
                <label
                  key={v}
                  onClick={() => handleVehicleToggle(v)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                    checked
                      ? 'border-primary-300 bg-primary-50/60 text-primary-900 font-semibold'
                      : 'border-surface-200 hover:border-surface-300 text-surface-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm">{v}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. Amenities & Security */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Amenities & Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'covered', label: 'Covered Roof', sub: 'Protects car from sun and rain' },
              { key: 'security', label: 'Security Guard', sub: '24/7 on-premise staff' },
              { key: 'cctv', label: 'CCTV Surveillance', sub: 'Continuous camera recording' },
              { key: 'evCharging', label: 'EV Charging Bay', sub: 'Electric vehicle plug available' },
              { key: 'gateAccess', label: 'Gated / Secure Entry', sub: 'Controlled barrier or lock' },
            ].map((amenity) => (
              <label
                key={amenity.key}
                onClick={() => handleInputChange(amenity.key, !formData[amenity.key])}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  formData[amenity.key]
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-semibold'
                    : 'border-surface-200 hover:border-surface-300 text-surface-700'
                }`}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border ${
                    formData[amenity.key]
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-surface-300'
                  }`}
                >
                  {formData[amenity.key] && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <span className="text-sm block">{amenity.label}</span>
                  <span className="text-xs text-surface-700 font-normal">{amenity.sub}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 5. Pricing */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                Pricing (₹)
              </h2>
              <p className="text-xs text-surface-700">Set competitive prices to maximize bookings</p>
            </div>
            <button
              type="button"
              onClick={handleGetSmartPrice}
              disabled={smartPriceLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-500/10 to-primary-500/10 hover:from-indigo-500/20 hover:to-primary-500/20 text-primary-700 border border-primary-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              {smartPriceLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculating optimal price...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                  Get Smart Price Suggestion
                </>
              )}
            </button>
          </div>

          {/* Smart Recommendation Card */}
          {smartPriceData && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50/70 via-indigo-50/50 to-white border border-primary-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs shadow-sm">
                    ✨
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-900">
                    Smart Pricing Recommendation
                  </h4>
                </div>
                {smartPriceData.demandInfo?.demandLevel && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      smartPriceData.demandInfo.demandLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : smartPriceData.demandInfo.demandLevel === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {smartPriceData.demandInfo.demandLevel === 'HIGH'
                      ? '🔥 High Demand Area'
                      : smartPriceData.demandInfo.demandLevel === 'MEDIUM'
                      ? '⚡ Moderate Demand'
                      : '🟢 Steady Demand'}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-surface-900">
                  ₹{smartPriceData.recommendedPricePerHour}
                  <span className="text-sm font-normal text-surface-700"> / hour</span>
                </span>
                <span className="text-xs text-surface-700">
                  (Suggested Range: ₹{smartPriceData.priceRange?.min} – ₹{smartPriceData.priceRange?.max})
                </span>
              </div>

              <p className="text-xs text-surface-700 leading-relaxed">
                <strong className="text-surface-900">Market Insight: </strong>
                {smartPriceData.reason}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-surface-700">
                  Based on local rates, amenities, and current demand.
                </span>
                <button
                  type="button"
                  onClick={applySmartPrice}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Apply Suggested Rates
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Hourly Rate (₹/hr)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pricePerHour}
                onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Daily Rate (₹/day)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pricePerDay}
                onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Monthly Pass (₹/mo)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pricePerMonth}
                onChange={(e) => handleInputChange('pricePerMonth', e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
          </div>
        </div>

        {/* 6. Availability Schedule */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Operating Days & Times
          </h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-2">
              Available Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = formData.availability.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                      active
                        ? 'bg-primary-50 border-primary-300 text-primary-700 font-bold'
                        : 'bg-surface-50 border-surface-200 text-surface-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Opening Time
              </label>
              <input
                type="time"
                value={formData.availability.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, startTime: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Closing Time
              </label>
              <input
                type="time"
                value={formData.availability.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, endTime: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 7. Photos */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-600" />
            Spot Photos (URLs)
          </h2>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
            <button
              type="button"
              onClick={handleAddPhoto}
              className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold rounded-xl text-sm transition-colors"
            >
              Add URL
            </button>
          </div>

          {/* Quick sample photo selector */}
          <div className="pt-2">
            <span className="text-xs text-surface-700 mr-2">Or click sample:</span>
            <div className="inline-flex gap-2 mt-1">
              {SAMPLE_PHOTOS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!formData.photos.includes(url)) {
                      setFormData((p) => ({ ...p, photos: [...p.photos, url] }));
                    }
                  }}
                  className="w-10 h-10 rounded-lg overflow-hidden border border-surface-200 hover:ring-2 hover:ring-primary-500 transition-all"
                >
                  <img src={url} alt="sample" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Photo Previews */}
          {formData.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {formData.photos.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-surface-200 h-24">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. Rules */}
        <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-surface-900">Parking Rules & Guidelines</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. No washing vehicles on premises"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
              className="flex-1 px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold rounded-xl text-sm transition-colors"
            >
              Add Rule
            </button>
          </div>

          {formData.rules.length > 0 && (
            <ul className="space-y-2 pt-2">
              {formData.rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-800"
                >
                  <span>{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-surface-700 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/host/parking"
            className="px-6 py-3 border border-surface-200 text-surface-700 hover:bg-surface-50 font-semibold rounded-xl text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Spot...
              </>
            ) : (
              'Create Parking Listing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddParking;
