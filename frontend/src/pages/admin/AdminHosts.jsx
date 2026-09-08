import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Search,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  ParkingSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { getHostsList, toggleUserBlock } from '../../services/adminService';

const AdminHosts = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [isVerified, setIsVerified] = useState('');

  const fetchHosts = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await getHostsList({
        page: p,
        search,
        isVerified,
      });
      if (res.success) {
        setHosts(res.data.hosts);
        setTotal(res.data.total);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, isVerified]);

  useEffect(() => {
    fetchHosts(1);
  }, [fetchHosts]);

  const handleToggleBlock = async (host) => {
    const confirmMsg = host.isBlocked
      ? `Unblock host ${host.name}?`
      : `Are you sure you want to suspend host ${host.name}? Their listings will become inaccessible.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await toggleUserBlock(host._id, {
        isBlocked: !host.isBlocked,
        blockReason: !host.isBlocked ? 'Host suspended by admin' : '',
      });
      if (res.success) fetchHosts(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update host');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Host Partner Management</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Monitor host partner verification, listing volumes, attendance reliability, and privileges.
          </p>
        </div>
        <Link
          to="/admin/verification"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm self-start sm:self-auto transition"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Host KYC Verification Desk →</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search host by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        <select
          value={isVerified}
          onChange={(e) => setIsVerified(e.target.value)}
          className="px-3 py-2 text-xs border border-surface-200 rounded-xl bg-white text-surface-800 font-semibold focus:outline-none"
        >
          <option value="">All Verification States</option>
          <option value="true">✓ Verified Hosts Only</option>
          <option value="false">Unverified Hosts Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-surface-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
            <p className="text-xs">Loading host partners...</p>
          </div>
        ) : hosts.length === 0 ? (
          <div className="p-12 text-center text-surface-500">
            <Home className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p className="text-sm font-bold text-surface-800">No host partners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50/80 text-surface-500 border-b border-surface-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 font-semibold">Host Partner</th>
                  <th className="p-4 font-semibold">KYC Verification</th>
                  <th className="p-4 font-semibold">Reliability</th>
                  <th className="p-4 font-semibold">Listings</th>
                  <th className="p-4 font-semibold">Account Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-surface-800">
                {hosts.map((h) => (
                  <tr key={h._id} className="hover:bg-surface-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs">
                          {h.name?.[0] || 'H'}
                        </div>
                        <div>
                          <p className="font-bold text-surface-900">{h.name}</p>
                          <p className="text-[11px] text-surface-500">{h.email}</p>
                          <p className="text-[10px] text-surface-400">{h.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {h.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Verified Host
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Pending KYC
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-surface-900">
                      {h.reliabilityScore !== undefined ? h.reliabilityScore : 100}%
                    </td>
                    <td className="p-4 font-semibold text-surface-700">
                      {h.spotCount || 0} spots
                    </td>
                    <td className="p-4">
                      {h.isBlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to="/admin/verification"
                          className="px-2.5 py-1 rounded-lg border border-surface-200 text-surface-700 hover:bg-surface-100 text-[11px] font-semibold transition"
                        >
                          Review KYC
                        </Link>
                        <button
                          onClick={() => handleToggleBlock(h)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            h.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {h.isBlocked ? 'Unblock' : 'Suspend'}
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
          <div className="p-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-600">
            <span>
              Page {page} of {totalPages} ({total} hosts)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchHosts(page - 1)}
                className="px-3 py-1 border border-surface-200 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchHosts(page + 1)}
                className="px-3 py-1 border border-surface-200 rounded-lg disabled:opacity-40"
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

export default AdminHosts;
