import { useState, useEffect } from 'react';
import { Car, Clock, Calendar, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getMyListings } from '../services/parkingService';
import { setLeavingHome } from '../services/bookingService';

const LeavingHomeModal = ({ isOpen, onClose, onSuccess }) => {
  const [listings, setListings] = useState([]);
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccessMsg(null);

    const fetchSpots = async () => {
      try {
        const res = await getMyListings();
        const spots = res.data?.parkingSpaces || res.data || [];
        setListings(spots);
        if (spots.length > 0) {
          setSelectedSpotId(spots[0]._id);
        }
      } catch (err) {
        console.error('Error fetching listings for leaving home:', err);
      }
    };

    fetchSpots();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpotId) {
      setError('Please select a parking spot');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await setLeavingHome(selectedSpotId, {
        date,
        startTime,
        endTime,
      });

      if (res.success) {
        setSuccessMsg('Your parking spot is now active for drivers while you are away!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Error setting leaving home schedule:', err);
      setError(err.response?.data?.message || 'Failed to activate Leaving Home schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-surface-700 hover:text-surface-900 rounded-xl hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">"I'm Leaving Home" Mode</h2>
            <p className="text-xs text-surface-700">
              Rent out your empty driveway while you commute to work or travel
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parking Spot Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
              Select Parking Spot *
            </label>
            {listings.length === 0 ? (
              <p className="text-xs text-surface-700">No parking spots listed yet.</p>
            ) : (
              <select
                value={selectedSpotId}
                onChange={(e) => setSelectedSpotId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
              >
                {listings.map((spot) => (
                  <option key={spot._id} value={spot._id}>
                    {spot.title} ({spot.city})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
              Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-surface-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
              />
            </div>
          </div>

          {/* Leaving & Returning Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Leaving At *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-surface-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 mb-1.5">
                Returning At *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-surface-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs text-surface-700">
            💡 Drivers searching for parking during these hours will see your spot available for
            instant booking.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-surface-700 hover:bg-surface-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || listings.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Spot Availability'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavingHomeModal;
