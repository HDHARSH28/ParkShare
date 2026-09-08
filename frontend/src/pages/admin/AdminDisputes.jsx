import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  DollarSign,
  User,
  RefreshCw,
  Loader,
  Eye,
  FileText,
} from 'lucide-react';
import { getAllDisputes, resolveDispute } from '../../services/disputeService';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Resolution Modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionText, setResolutionText] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await getAllDisputes({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setDisputes(res.data.disputes || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [page, statusFilter]);

  const openResolveModal = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionStatus(dispute.status === 'OPEN' ? 'UNDER_REVIEW' : 'RESOLVED');
    setResolutionText(dispute.resolution || '');
    setRefundAmount(dispute.refundAmount || '');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      setActionLoading(true);
      await resolveDispute(selectedDispute._id, {
        status: resolutionStatus,
        resolution: resolutionText,
        refundAmount: refundAmount ? Number(refundAmount) : 0,
      });
      setSelectedDispute(null);
      setFeedbackMsg(`Dispute status updated to ${resolutionStatus}.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Open
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Resolved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispute Resolution Desk</h1>
          <p className="text-slate-500 text-sm mt-1">
            Arbitrate booking disputes, assign refunds, and enforce host-driver platform policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalCount} Total Disputes
          </span>
          <button
            onClick={fetchDisputes}
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
        {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((st) => (
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
            {st === 'ALL' ? 'All Disputes' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Disputes Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading disputes desk...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No disputes found</p>
            <p className="text-xs text-slate-400 mt-1">There are no customer disputes under this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Dispute Case</th>
                  <th className="px-4 py-3.5">Raised By</th>
                  <th className="px-4 py-3.5">Reason & Description</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Resolution / Refund</th>
                  <th className="px-4 py-3.5 text-right">Arbitrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((dsp) => (
                  <tr key={dsp._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        #{dsp._id.slice(-6).toUpperCase()}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Booking: #{dsp.booking?._id ? dsp.booking._id.slice(-6).toUpperCase() : (dsp.booking || 'N/A')}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900">{dsp.user?.name || 'Driver'}</p>
                        <p className="text-slate-400 text-[11px]">{dsp.user?.email}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 mb-1">
                        {dsp.reason}
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {dsp.description}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(dsp.status)}</td>

                    <td className="px-4 py-3.5">
                      {dsp.resolution ? (
                        <div className="text-xs">
                          <p className="text-slate-800 line-clamp-1 italic font-medium">"{dsp.resolution}"</p>
                          {dsp.refundAmount > 0 && (
                            <span className="inline-block text-[11px] font-bold text-emerald-600 mt-0.5">
                              Refund: ₹{dsp.refundAmount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pending arbitration</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openResolveModal(dsp)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                      >
                        Action
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

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Arbitrate Dispute #{selectedDispute._id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Claimant: <span className="font-semibold text-slate-700">{selectedDispute.user?.name}</span> ({selectedDispute.reason})
            </p>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Change Dispute Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setResolutionStatus(st)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        resolutionStatus === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Resolution & Finding
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="State the decision, reason, and any compensatory steps taken..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Refund Amount (Optional, ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  {actionLoading ? 'Updating...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
