import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  ExternalLink,
  RefreshCw,
  Loader,
  AlertCircle,
} from 'lucide-react';
import {
  getAllVerifications,
  reviewVerification,
} from '../../services/verificationService';

const AdminVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review Modal
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED');
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await getAllVerifications({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setVerifications(res.data.verifications || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter]);

  const openReviewModal = (kyc, action) => {
    setSelectedKyc(kyc);
    setReviewAction(action);
    setAdminComment(
      action === 'APPROVED'
        ? 'Identity documents verified and approved. Host granted verified status.'
        : 'Documents unclear or non-compliant. Please re-upload legible government ID.'
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKyc) return;

    try {
      setActionLoading(true);
      await reviewVerification(selectedKyc._id, {
        status: reviewAction,
        adminComment,
      });
      setSelectedKyc(null);
      setFeedbackMsg(`Host verification request ${reviewAction.toLowerCase()} successfully.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3" /> Needs Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Host Verification Desk</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review government IDs, address proofs, and approve hosts to publish marketplace spaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalCount} Total Submissions
          </span>
          <button
            onClick={fetchVerifications}
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
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
            {st === 'ALL' ? 'All Submissions' : st}
          </button>
        ))}
      </div>

      {/* Verification Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading KYC submissions...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No verification requests found</p>
            <p className="text-xs text-slate-400 mt-1">All host verification queues are currently cleared.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Applicant Host</th>
                  <th className="px-4 py-3.5">Documents Attached</th>
                  <th className="px-4 py-3.5">Submitted On</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Admin Comments</th>
                  <th className="px-4 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.map((kyc) => (
                  <tr key={kyc._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                          {kyc.user?.name?.charAt(0) || 'H'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{kyc.user?.name || 'Unknown Host'}</p>
                          <p className="text-xs text-slate-400">{kyc.user?.email}</p>
                          {kyc.user?.phone && (
                            <p className="text-[11px] text-slate-400">{kyc.user?.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {kyc.documents && kyc.documents.length > 0 ? (
                          kyc.documents.map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc.fileUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline mr-2"
                            >
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="font-medium">{doc.docType || 'Document'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No documents listed</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(kyc.status)}</td>

                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-500 max-w-xs truncate" title={kyc.adminComment}>
                        {kyc.adminComment || '—'}
                      </p>
                      {kyc.reviewedAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Reviewed: {new Date(kyc.reviewedAt).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReviewModal(kyc, 'APPROVED')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(kyc, 'REJECTED')}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                        >
                          Reject
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

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              {reviewAction === 'APPROVED' ? 'Approve Verification' : 'Reject Verification'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Applicant: <span className="font-semibold text-slate-700">{selectedKyc.user?.name}</span> ({selectedKyc.user?.email})
            </p>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Verification Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Approve Host
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✕ Reject Request
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reviewer Notes / Feedback
                </label>
                <textarea
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Feedback provided to the host regarding this verification status..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedKyc(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Saving...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
