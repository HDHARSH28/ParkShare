import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Eye,
  Shield,
  Car,
  DollarSign,
  Loader,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  getAdminListings,
  updateListingStatus,
  deleteListing,
} from '../../services/adminService';

const AdminParking = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

  // Modal states
  const [selectedListing, setSelectedListing] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectListingId, setRejectListingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteListingId, setDeleteListingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await getAdminListings({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setListings(res.data.listings || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalListings(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching parking listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await updateListingStatus(id, { status: 'active', isFlagged: false, adminComment: 'Approved by administrator' });
      setFeedbackMsg('Listing successfully approved and activated.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve listing');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setRejectListingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectListingId) return;
    try {
      setActionLoading(true);
      await updateListingStatus(rejectListingId, {
        status: 'rejected',
        adminComment: rejectReason || 'Listing rejected due to non-compliance or incomplete details.',
      });
      setRejectModalOpen(false);
      setFeedbackMsg('Listing rejected and marked with administrator comment.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject listing');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteListingId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteListingId) return;
    try {
      setActionLoading(true);
      await deleteListing(deleteListingId);
      setDeleteModalOpen(false);
      setFeedbackMsg('Listing permanently deleted.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, isFlagged) => {
    if (isFlagged || status === 'flagged') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" /> Flagged / Reported
        </span>
      );
    }
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Active / Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review / Draft
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Space Moderation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, approve, flag, or remove parking listings across all platform hosts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalListings} Listings Total
          </span>
          <button
            onClick={fetchListings}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, address, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 ml-1 hidden sm:block" />
          {['ALL', 'active', 'draft', 'flagged', 'rejected', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'draft'
                ? 'Pending Review'
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading parking spaces...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No parking spaces found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Parking Listing</th>
                  <th className="px-4 py-3.5">Host</th>
                  <th className="px-4 py-3.5">Rate</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((space) => (
                  <tr key={space._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {space.photos && space.photos.length > 0 ? (
                            <img
                              src={space.photos[0]}
                              alt={space.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight line-clamp-1">
                            {space.title}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {space.address}, {space.city}
                          </p>
                          <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {space.parkingType || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {space.host ? (
                        <div>
                          <p className="font-medium text-slate-800">{space.host.name}</p>
                          <p className="text-xs text-slate-400">{space.host.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unknown Host</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">₹{space.pricePerHour}/hr</p>
                      {space.pricePerDay && (
                        <p className="text-xs text-slate-400">₹{space.pricePerDay}/day</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {getStatusBadge(space.status, space.isFlagged)}
                      {space.adminComment && (
                        <p className="text-[11px] text-slate-400 mt-1 italic max-w-xs truncate" title={space.adminComment}>
                          Note: {space.adminComment}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-900">{space.rating || 0}</span>
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-xs text-slate-400">({space.totalReviews || 0})</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedListing(space)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {space.status !== 'active' && (
                          <button
                            onClick={() => handleApprove(space._id)}
                            disabled={actionLoading}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Approve & Activate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {space.status !== 'rejected' && (
                          <button
                            onClick={() => openRejectModal(space._id)}
                            disabled={actionLoading}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Reject Listing"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => openDeleteModal(space._id)}
                          disabled={actionLoading}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-600" /> Reject Parking Space
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Please specify the reason for rejecting this listing. The host will be notified with this remark.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Inaccurate location, insufficient gate access details, poor quality photos..."
              className="w-full mt-3 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" /> Remove Listing Permanently
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to permanently delete this parking listing? This action cannot be undone and will detach any historical references.
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
                {actionLoading ? 'Deleting...' : 'Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedListing.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedListing.address}, {selectedListing.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              {/* Photos Gallery */}
              {selectedListing.photos && selectedListing.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Photos ({selectedListing.photos.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedListing.photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg text-xs leading-relaxed">
                  {selectedListing.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Type</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedListing.parkingType}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Hourly Rate</span>
                  <span className="font-semibold text-indigo-600 text-xs">₹{selectedListing.pricePerHour}/hr</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Status</span>
                  <span className="font-semibold text-slate-800 text-xs capitalize">{selectedListing.status}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Covered</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedListing.covered ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Security Guard</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedListing.security ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">EV Charging</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedListing.evCharging ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Host Info */}
              {selectedListing.host && (
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Host Information
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-800">{selectedListing.host.name}</p>
                      <p className="text-xs text-slate-500">{selectedListing.host.email}</p>
                      {selectedListing.host.phone && (
                        <p className="text-xs text-slate-500">{selectedListing.host.phone}</p>
                      )}
                    </div>
                    {selectedListing.host.isVerifiedHost && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        ✓ Verified Host
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParking;
