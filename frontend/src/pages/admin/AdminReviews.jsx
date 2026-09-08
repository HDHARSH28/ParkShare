import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Shield,
  Sparkles,
  MapPin,
  RefreshCw,
  Loader,
} from 'lucide-react';
import { getAdminReviews, deleteReview } from '../../services/adminService';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getAdminReviews({
        rating: ratingFilter,
        page,
        limit: 12,
      });
      if (res.success) {
        setReviews(res.data.reviews || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, ratingFilter]);

  const openDeleteModal = (id) => {
    setSelectedReviewId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReviewId) return;
    try {
      setActionLoading(true);
      await deleteReview(selectedReviewId);
      setDeleteModalOpen(false);
      setFeedbackMsg('Review removed from platform and host/parking rating recalculated.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (count) => {
    return (
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i <= count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review & Rating Moderation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor feedback, ratings, and moderate customer reviews across parking spaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalCount} Total Reviews
          </span>
          <button
            onClick={fetchReviews}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        {['ALL', '5', '4', '3', '2', '1'].map((rt) => (
          <button
            key={rt}
            onClick={() => {
              setRatingFilter(rt);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              ratingFilter === rt
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {rt === 'ALL' ? 'All Ratings' : `${rt} Stars ★`}
          </button>
        ))}
      </div>

      {/* Reviews Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading reviews stream...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No reviews found</p>
            <p className="text-xs text-slate-400 mt-1">There are no reviews matching this filter query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Reviewer & Host</th>
                  <th className="px-4 py-3.5">Parking Listing</th>
                  <th className="px-4 py-3.5">Overall Rating</th>
                  <th className="px-4 py-3.5">Category Scores</th>
                  <th className="px-4 py-3.5">Customer Comment</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900">{rev.user?.name || 'Driver'}</p>
                        <p className="text-slate-400 text-[11px]">{rev.user?.email}</p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Host: <span className="font-medium text-slate-700">{rev.host?.name || 'Host'}</span>
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 text-xs line-clamp-1">
                        {rev.parkingSpace?.title || 'Parking Spot'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {rev.parkingSpace?.city || 'India'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {renderStars(rev.rating)}
                          <span className="font-bold text-slate-800 text-xs ml-1">{rev.rating}/5</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-[11px] space-y-0.5 text-slate-500">
                        <p>Safety: <span className="font-semibold text-slate-700">{rev.safetyRating || 5}/5</span></p>
                        <p>Cleanliness: <span className="font-semibold text-slate-700">{rev.cleanlinessRating || 5}/5</span></p>
                        <p>Location: <span className="font-semibold text-slate-700">{rev.locationRating || 5}/5</span></p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-700 max-w-sm italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{rev.comment || 'No textual comment left by user.'}"
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openDeleteModal(rev._id)}
                        disabled={actionLoading}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" /> Remove Review
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete this customer review? The parking space rating average and total review count will be recalculated.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                {actionLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
