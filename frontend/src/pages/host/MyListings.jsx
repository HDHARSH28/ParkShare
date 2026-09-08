import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Car,
  MapPin,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { getMyListings, updateParking, deleteParking } from '../../services/parkingService';
import LeavingHomeModal from '../../components/LeavingHomeModal';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [submittingId, setSubmittingId] = useState(null);
  const [leavingHomeOpen, setLeavingHomeOpen] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyListings();
      if (res.success) {
        setListings(res.data?.parkingSpaces || res.data || []);
      }
    } catch (err) {
      console.error('Error fetching host listings:', err);
      setError(err.response?.data?.message || 'Failed to load your parking listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleToggleStatus = async (space) => {
    try {
      setSubmittingId(space._id);
      const newStatus = space.status === 'active' ? 'inactive' : 'active';
      const res = await updateParking(space._id, { status: newStatus });
      if (res.success) {
        setListings((prev) =>
          prev.map((item) => (item._id === space._id ? { ...item, status: newStatus } : item))
        );
        setActionSuccess(
          newStatus === 'active'
            ? `"${space.title}" is now published and active!`
            : `"${space.title}" is unpublished.`
        );
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.response?.data?.message || 'Could not update listing status');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    try {
      setSubmittingId(deleteModal.id);
      const res = await deleteParking(deleteModal.id);
      if (res.success) {
        setListings((prev) => prev.filter((item) => item._id !== deleteModal.id));
        setActionSuccess(`"${deleteModal.title}" was deleted.`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error deleting parking:', err);
      setError(err.response?.data?.message || 'Failed to delete parking listing');
    } finally {
      setSubmittingId(null);
      setDeleteModal({ open: false, id: null, title: '' });
    }
  };

  const activeCount = listings.filter((l) => l.status === 'active').length;
  const draftCount = listings.filter((l) => l.status === 'draft').length;
  const inactiveCount = listings.filter((l) => l.status === 'inactive').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            My Parking Listings
          </h1>
          <p className="text-surface-700 text-sm mt-1">
            Manage your listed spaces, toggle publishing status, and monitor your spots
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setLeavingHomeOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Car className="w-3.5 h-3.5 text-emerald-600" />
            "I'm Leaving Home" Mode
          </button>
          <Link
            to="/host/parking/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Parking Spot
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-surface-700">Total Listings</p>
          <p className="text-2xl font-black text-surface-900 mt-1">{listings.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-600">Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-600">Drafts</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-surface-700">Inactive</p>
          <p className="text-2xl font-black text-surface-700 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-700">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Loading your listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-surface-200 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No parking spaces listed yet</h3>
          <p className="text-sm text-surface-700 mb-6 max-w-md mx-auto">
            Got an empty driveway, garage, or vacant spot? List it on ParkShare and start earning passive income today!
          </p>
          <Link
            to="/host/parking/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl text-sm hover:bg-primary-700 shadow-md shadow-primary-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((space) => {
            const photo = space.photos?.[0];
            const isSubmitting = submittingId === space._id;

            return (
              <div
                key={space._id}
                className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden shrink-0 border border-surface-200 flex items-center justify-center">
                    <Link to={`/parking/${space._id}`} className="w-full h-full flex items-center justify-center cursor-pointer">
                      {photo ? (
                        <img src={photo} alt={space.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      ) : (
                        <Car className="w-8 h-8 text-surface-700/40" />
                      )}
                    </Link>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-surface-100 text-surface-800">
                        {space.parkingType}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          space.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : space.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-surface-100 text-surface-700'
                        }`}
                      >
                        {space.status.toUpperCase()}
                      </span>
                    </div>

                    <Link to={`/parking/${space._id}`} className="hover:text-primary-600 transition-colors inline-block max-w-full">
                      <h3 className="font-bold text-base text-surface-900 truncate hover:text-primary-600 transition-colors cursor-pointer">{space.title}</h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-surface-700 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{space.address}, {space.city}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-surface-900 mt-2">
                      {space.pricePerHour > 0 && <span>₹{space.pricePerHour}/hr</span>}
                      {space.pricePerDay > 0 && <span>₹{space.pricePerDay}/day</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-surface-100 justify-end">
                  {/* View public link */}
                  <Link
                    to={`/parking/${space._id}`}
                    title="View public page"
                    className="p-2 text-surface-700 hover:text-primary-600 hover:bg-surface-100 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Toggle publish/unpublish */}
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleToggleStatus(space)}
                    title={space.status === 'active' ? 'Unpublish spot' : 'Publish spot'}
                    className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                      space.status === 'active'
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : space.status === 'active' ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  {/* Edit */}
                  <Link
                    to={`/host/parking/edit/${space._id}`}
                    title="Edit listing"
                    className="p-2 text-surface-700 hover:text-primary-600 hover:bg-surface-100 rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {/* Delete */}
                  <button
                    disabled={isSubmitting}
                    onClick={() =>
                      setDeleteModal({ open: true, id: space._id, title: space.title })
                    }
                    title="Delete listing"
                    className="p-2 text-surface-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900">Delete Parking Spot</h3>
              <p className="text-sm text-surface-700 mt-1">
                Are you sure you want to permanently remove <strong>"{deleteModal.title}"</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, title: '' })}
                className="px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submittingId !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submittingId ? 'Deleting...' : 'Delete Spot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaving Home Modal */}
      <LeavingHomeModal
        isOpen={leavingHomeOpen}
        onClose={() => setLeavingHomeOpen(false)}
        onSuccess={fetchListings}
      />
    </div>
  );
};

export default MyListings;
