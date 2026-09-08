import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Car,
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CreditCard,
  MapPin,
  Tag,
} from 'lucide-react';
import { getParkingById } from '../../services/parkingService';
import { getVehicles, addVehicle } from '../../services/vehicleService';
import { createBooking, getParkingAvailability, getBookingQuote } from '../../services/bookingService';

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Hatchback', 'Sedan', 'SUV', 'EV'];

const BookingCheckout = () => {
  const { parkingId } = useParams();
  const navigate = useNavigate();

  const [parking, setParking] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);

  // Strict check: Only PAID bookings that are CONFIRMED or ACTIVE count as booked!
  // Unpaid, pending, or failed bookings must NEVER block or display as booked.
  const bookedSlots = useMemo(() => {
    const list = availabilityData?.bookedSlots || [];
    return list.filter((s) => s.paymentStatus === 'PAID' && (s.status === 'CONFIRMED' || s.status === 'ACTIVE'));
  }, [availabilityData]);

  // Date and Time state (defaults: today, next hour to next + 2 hours)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [bookingDate, setBookingDate] = useState(todayStr);

  const defaultStartTime = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toTimeString().slice(0, 5);
  }, []);

  const defaultEndTime = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 3, 0, 0, 0);
    return d.toTimeString().slice(0, 5);
  }, []);

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);

  // Clear server error whenever date/time changes
  useEffect(() => {
    setError(null);
  }, [bookingDate, startTime, endTime]);

  // Real-time conflict detection with existing confirmed/paid booked slots
  const slotConflict = useMemo(() => {
    if (!bookingDate || !startTime || !endTime || bookedSlots.length === 0) return null;
    const reqStart = new Date(`${bookingDate}T${startTime}:00`).getTime();
    const reqEnd = new Date(`${bookingDate}T${endTime}:00`).getTime();
    if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) return null;

    for (const slot of bookedSlots) {
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = new Date(slot.endTime).getTime();
      if (reqStart < slotEnd && reqEnd > slotStart) {
        const s = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const e = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Selected time overlaps with booked slot (${s} - ${e}). Please adjust your arrival or departure time.`;
      }
    }
    return null;
  }, [bookingDate, startTime, endTime, bookedSlots]);

  // Live pricing quote
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Add Vehicle modal / inline form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    vehicleType: 'Sedan',
    model: '',
    color: '',
  });
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Fetch initial spot data and vehicles
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [parkingRes, vehiclesRes] = await Promise.all([
          getParkingById(parkingId),
          getVehicles(),
        ]);

        if (parkingRes.success) {
          const spot = parkingRes.data?.parking || parkingRes.data;
          setParking(spot);
        }

        if (vehiclesRes.success) {
          const vList = vehiclesRes.data?.vehicles || [];
          setVehicles(vList);
          if (vList.length > 0) {
            setSelectedVehicleId(vList[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading checkout:', err);
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [parkingId]);

  // Fetch booked intervals when date changes
  useEffect(() => {
    if (!parkingId || !bookingDate) return;
    const fetchAvail = async () => {
      try {
        const res = await getParkingAvailability(parkingId, bookingDate);
        if (res.success) {
          setAvailabilityData(res.data);
        }
      } catch (e) {
        console.warn('Could not fetch booked slots:', e);
      }
    };
    fetchAvail();
  }, [parkingId, bookingDate]);

  // Recalculate price quote when time/date/parking changes
  useEffect(() => {
    if (!parking || !bookingDate || !startTime || !endTime) return;

    const startISO = `${bookingDate}T${startTime}:00`;
    const endISO = `${bookingDate}T${endTime}:00`;

    if (new Date(endISO) <= new Date(startISO)) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        const res = await getBookingQuote({
          parkingSpaceId: parking._id,
          startTime: startISO,
          endTime: endISO,
        });
        if (res.success) {
          setQuote(res.data);
        }
      } catch (e) {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, [parking, bookingDate, startTime, endTime]);

  // Handle adding a vehicle on the fly
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicleNumber.trim()) return;

    try {
      setAddingVehicle(true);
      const res = await addVehicle(newVehicle);
      if (res.success && res.data?.vehicle) {
        const created = res.data.vehicle;
        setVehicles((prev) => [created, ...prev]);
        setSelectedVehicleId(created._id);
        setShowAddVehicle(false);
        setNewVehicle({ vehicleNumber: '', vehicleType: 'Sedan', model: '', color: '' });
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      alert(err.response?.data?.message || 'Could not add vehicle');
    } finally {
      setAddingVehicle(false);
    }
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    setError(null);

    if (!selectedVehicleId) {
      setError('Please select or add a vehicle for this booking');
      return;
    }

    const startISO = `${bookingDate}T${startTime}:00`;
    const endISO = `${bookingDate}T${endTime}:00`;

    if (new Date(endISO) <= new Date(startISO)) {
      setError('End time must be strictly after start time');
      return;
    }

    if (slotConflict) {
      setError(slotConflict);
      return;
    }

    try {
      setSubmitting(true);
      const res = await createBooking({
        parkingSpaceId: parking._id,
        vehicleId: selectedVehicleId,
        startTime: new Date(startISO).toISOString(),
        endTime: new Date(endISO).toISOString(),
      });

      if (res.success && res.data?.booking) {
        navigate(`/payment/${res.data.booking._id}`);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.response?.data?.message || 'Failed to complete booking. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-surface-700">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Preparing booking checkout...</p>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-surface-900 mb-1">Spot Unavailable</h2>
        <p className="text-sm text-surface-700 mb-6">Could not load parking space details.</p>
        <Link
          to="/parking"
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
        >
          Browse Parking
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Back Link */}
      <div className="mb-6">
        <Link
          to={`/parking/${parking._id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to spot details
        </Link>
        <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
          Reserve Parking Spot
        </h1>
        <p className="text-surface-700 text-sm">
          Select your vehicle, choose arrival & departure times, and confirm your booking
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Booking Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parking Spot Summary Card */}
          <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            <div className="w-full sm:w-28 h-28 rounded-2xl bg-surface-100 overflow-hidden shrink-0 border border-surface-200 flex items-center justify-center">
              {parking.photos?.[0] ? (
                <img
                  src={parking.photos[0]}
                  alt={parking.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Car className="w-10 h-10 text-surface-700/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-md bg-primary-50 text-primary-700">
                  {parking.parkingType}
                </span>
                {parking.covered && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    Covered
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-surface-900 truncate">{parking.title}</h2>
              <p className="text-xs text-surface-700 flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-600" />
                {parking.address}, {parking.city}
              </p>
              <p className="text-sm font-semibold text-surface-900 mt-2">
                Rate: ₹{parking.pricePerHour}
                <span className="text-xs font-normal text-surface-700">/hr</span>
              </p>
            </div>
          </div>

          {/* Vehicle Selection Card */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary-600" />
                Select Vehicle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVehicle(!showAddVehicle)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddVehicle ? 'Cancel' : 'Add Vehicle'}
              </button>
            </div>

            {/* Inline Add Vehicle Form */}
            {showAddVehicle && (
              <form
                onSubmit={handleCreateVehicle}
                className="p-4 bg-primary-50/50 border border-primary-200 rounded-2xl space-y-3"
              >
                <p className="text-xs font-bold text-primary-900">Add New Vehicle</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH 12 AB 1234"
                      value={newVehicle.vehicleNumber}
                      onChange={(e) =>
                        setNewVehicle((v) => ({ ...v, vehicleNumber: e.target.value.toUpperCase() }))
                      }
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Vehicle Type *
                    </label>
                    <select
                      value={newVehicle.vehicleType}
                      onChange={(e) =>
                        setNewVehicle((v) => ({ ...v, vehicleType: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white"
                    >
                      {VEHICLE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Model / Make
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Honda City"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle((v) => ({ ...v, model: e.target.value }))}
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Silver"
                      value={newVehicle.color}
                      onChange={(e) => setNewVehicle((v) => ({ ...v, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingVehicle}
                    className="px-4 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 disabled:opacity-50"
                  >
                    {addingVehicle ? 'Saving...' : 'Save & Select'}
                  </button>
                </div>
              </form>
            )}

            {/* Vehicle List */}
            {vehicles.length === 0 ? (
              <div className="p-5 border border-dashed border-surface-300 rounded-2xl text-center space-y-2">
                <Car className="w-8 h-8 text-surface-700 mx-auto opacity-40" />
                <p className="text-xs text-surface-700">No vehicle registered yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(true)}
                  className="px-4 py-1.5 bg-primary-50 text-primary-700 font-semibold rounded-xl text-xs hover:bg-primary-100"
                >
                  + Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => {
                  const selected = selectedVehicleId === v._id;
                  return (
                    <div
                      key={v._id}
                      onClick={() => setSelectedVehicleId(v._id)}
                      className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                        selected
                          ? 'border-primary-500 bg-primary-50/50 shadow-sm ring-1 ring-primary-500'
                          : 'border-surface-200 hover:border-surface-300 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-sm text-surface-900 tracking-wide">
                          {v.vehicleNumber}
                        </p>
                        <p className="text-xs text-surface-700">
                          {v.model ? `${v.model} • ` : ''}
                          {v.vehicleType} {v.color ? `(${v.color})` : ''}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-surface-300'
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Time Selection Card */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-7 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Date & Time Slot
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                  Booking Date *
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                  Arrival Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                  Departure Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
                />
              </div>
            </div>

            {/* Real-Time Slot Conflict Alert */}
            {slotConflict && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-1 text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Time Slot Unavailable</p>
                  <p className="text-red-700">{slotConflict}</p>
                </div>
              </div>
            )}

            {/* Booked Intervals Alert */}
            {bookedSlots.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Already Booked Time Slots on {bookingDate}:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {bookedSlots.map((slot, i) => {
                    const s = new Date(slot.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const e = new Date(slot.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <span
                        key={i}
                        className="px-2 py-1 bg-red-100/80 text-red-800 border border-red-200 rounded-lg font-mono font-medium"
                      >
                        {s} - {e} (Booked)
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Price Breakdown & Confirmation */}
        <div>
          <div className="sticky top-24 bg-white rounded-3xl border border-surface-200 p-6 shadow-xl shadow-surface-900/5 space-y-6">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-600" />
              Fare Summary
            </h3>

            {quoteLoading ? (
              <div className="py-8 text-center text-surface-700 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-1" />
                Calculating fare...
              </div>
            ) : quote ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-surface-700">
                  <span>Duration</span>
                  <span className="font-medium text-surface-900">
                    {quote.durationHours} hrs ({quote.billedHours} hrs billed)
                  </span>
                </div>
                <div className="flex justify-between text-surface-700">
                  <span>Base Parking Fee</span>
                  <span className="font-medium text-surface-900">₹{quote.basePrice}</span>
                </div>
                <div className="flex justify-between text-surface-700">
                  <span>Platform Fee (10%)</span>
                  <span className="font-medium text-surface-900">₹{quote.platformFee}</span>
                </div>
                <div className="flex justify-between text-surface-700">
                  <span>GST / Taxes (18%)</span>
                  <span className="font-medium text-surface-900">₹{quote.tax}</span>
                </div>
                <hr className="border-surface-100" />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-surface-900">Total Payable</span>
                  <span className="text-2xl font-black text-surface-900">
                    ₹{quote.totalAmount}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-surface-700 py-4 text-center">
                Select valid arrival and departure times to preview pricing breakdown.
              </p>
            )}

            {/* Slot Conflict / Error Alert inside sticky card */}
            {slotConflict ? (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{slotConflict}</span>
              </div>
            ) : error ? (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant slot reservation with guaranteed parking</span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting || !quote || !selectedVehicleId || Boolean(slotConflict)}
              onClick={handleConfirmBooking}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reserving Slot...
                </>
              ) : slotConflict ? (
                'Slot Overlaps With Booked Time'
              ) : (
                'Proceed to Payment'
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-surface-700">
              <CreditCard className="w-3.5 h-3.5 text-primary-600" />
              <span>Instant Confirmation • Secure QR Entry Pass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
