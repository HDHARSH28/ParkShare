import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  ArrowDownLeft,
  CheckCircle,
  RefreshCw,
  Loader,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { getAdminPayments } from '../../services/adminService';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAdminPayments({
        paymentStatus: statusFilter,
        page,
        limit: 12,
      });
      if (res.success) {
        setPayments(res.data.payments || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalPayments(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  // Aggregate stats from current view/list
  const totalVolume = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const platformFees = payments.reduce((acc, p) => acc + (p.platformFee || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Captured
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowDownLeft className="w-3 h-3" /> Refunded
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            {status || 'PENDING'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Ledger & Audit</h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete records of all transaction orders, platform commissions, and refunds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-100">
            {totalPayments} Transactions
          </span>
          <button
            onClick={fetchPayments}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled Volume</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{totalVolume.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Across current query batch</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Fee Revenue</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">₹{platformFees.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Retained platform margins</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment System</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">Direct In-App</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">UPI & Card Verified</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          {['ALL', 'PAID', 'REFUNDED', 'FAILED', 'PENDING'].map((st) => (
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
              {st === 'ALL' ? 'All Transactions' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading financial ledger...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No transactions recorded</p>
            <p className="text-xs text-slate-400 mt-1">There are no payment entries for this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Gateway IDs</th>
                  <th className="px-4 py-3.5">Driver & Host</th>
                  <th className="px-4 py-3.5">Listing</th>
                  <th className="px-4 py-3.5">Total Paid</th>
                  <th className="px-4 py-3.5">Fee & Tax</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-mono text-xs font-semibold text-slate-800">
                          {p.transactionId || p.razorpayPaymentId || `TXN-${p._id.slice(-8).toUpperCase()}`}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {p.paymentMethod || 'DIRECT_TRANSFER'}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs">
                        <p className="font-medium text-slate-900">{p.user?.name || 'Driver'}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          to <span className="text-slate-600">{p.host?.name || 'Host'}</span>
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 text-xs line-clamp-1">
                        {p.parkingSpace?.title || 'Parking Space'}
                      </p>
                      <p className="text-[11px] text-slate-400">{p.parkingSpace?.city || 'India'}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-sm">₹{p.totalAmount}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-600">
                        <p>Fee: <span className="font-semibold text-indigo-600">₹{p.platformFee || 0}</span></p>
                        <p className="text-[11px] text-slate-400">Tax: ₹{p.tax || 0}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(p.paymentStatus)}</td>

                    <td className="px-4 py-3.5 text-right text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
    </div>
  );
};

export default AdminPayments;
