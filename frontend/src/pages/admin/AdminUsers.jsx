import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  X,
  Car,
  Home,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getUsersList, getUserDetails, toggleUserBlock } from '../../services/adminService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [isBlocked, setIsBlocked] = useState('');

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const fetchUsers = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await getUsersList({
        page: p,
        search,
        role: role === 'ALL' ? '' : role,
        isBlocked,
      });
      if (res.success) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, role, isBlocked]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleOpenDetails = async (u) => {
    setSelectedUser(u);
    try {
      setDetailsLoading(true);
      const res = await getUserDetails(u._id);
      if (res.success) {
        setUserDetails(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockModalUser) return;
    try {
      setBlockSubmitting(true);
      const newBlockedState = !blockModalUser.isBlocked;
      const res = await toggleUserBlock(blockModalUser._id, {
        isBlocked: newBlockedState,
        blockReason: newBlockedState ? blockReason : '',
      });
      if (res.success) {
        setBlockModalUser(null);
        setBlockReason('');
        fetchUsers(page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setBlockSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">User Management</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Audit registered accounts, role privileges, verification flags, and suspension status.
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-100 border border-surface-200 text-surface-700 text-xs font-semibold rounded-xl self-start sm:self-auto">
          Total Registered: <strong className="text-surface-900">{total}</strong>
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* Role Filter */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 text-xs border border-surface-200 rounded-xl bg-white text-surface-800 font-semibold focus:outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="HOST">Hosts</option>
          <option value="ADMIN">Admins</option>
        </select>

        {/* Status Filter */}
        <select
          value={isBlocked}
          onChange={(e) => setIsBlocked(e.target.value)}
          className="px-3 py-2 text-xs border border-surface-200 rounded-xl bg-white text-surface-800 font-semibold focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="false">Active Only</option>
          <option value="true">Suspended / Blocked</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            <p className="text-xs">Loading user database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-surface-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p className="text-sm font-bold text-surface-800">No users match your criteria</p>
            <p className="text-xs mt-1">Try resetting search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50/80 text-surface-500 border-b border-surface-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Verification & Trust</th>
                  <th className="p-4 font-semibold">Account Status</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-surface-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-700 flex items-center justify-center font-bold text-xs">
                          {u.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-surface-900">{u.name}</p>
                          <p className="text-[11px] text-surface-500">{u.email}</p>
                          <p className="text-[10px] text-surface-400">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'HOST'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            ✓ Verified Host
                          </span>
                        ) : u.role === 'HOST' ? (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Unverified Host
                          </span>
                        ) : (
                          <span className="text-[11px] text-surface-400">Driver Account</span>
                        )}
                        {u.reliabilityScore !== undefined && (
                          <p className="text-[10px] text-surface-500">
                            Reliability: {u.reliabilityScore}%
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <Ban className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-surface-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDetails(u)}
                          className="px-2.5 py-1 rounded-lg border border-surface-200 text-surface-700 hover:bg-surface-100 text-[11px] font-semibold transition"
                        >
                          View Profile
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => {
                              setBlockModalUser(u);
                              setBlockReason(u.blockReason || '');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              u.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block User'}
                          </button>
                        )}
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
              Page {page} of {totalPages} ({total} users)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1)}
                className="px-3 py-1 border border-surface-200 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchUsers(page + 1)}
                className="px-3 py-1 border border-surface-200 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-surface-200 space-y-6">
            <div className="flex items-center justify-between border-b border-surface-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-surface-900">{selectedUser.name}</h3>
                <p className="text-xs text-surface-500">{selectedUser.email} • {selectedUser.role}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center text-surface-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                <p className="text-xs">Fetching profile and associated records...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Snapshot */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-surface-50 rounded-2xl border border-surface-200 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-surface-500">Account</span>
                    <p className="text-sm font-extrabold text-surface-900 mt-0.5">
                      {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-surface-500">Role</span>
                    <p className="text-sm font-extrabold text-surface-900 mt-0.5">
                      {selectedUser.role}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-surface-500">Reliability</span>
                    <p className="text-sm font-extrabold text-surface-900 mt-0.5">
                      {selectedUser.reliabilityScore || 100}%
                    </p>
                  </div>
                </div>

                {/* Vehicles */}
                {userDetails?.vehicles && userDetails.vehicles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 mb-2 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" /> Registered Vehicles ({userDetails.vehicles.length})
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {userDetails.vehicles.map((v) => (
                        <div key={v._id} className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs">
                          <p className="font-bold text-surface-900">{v.vehicleNumber}</p>
                          <p className="text-surface-500 text-[11px]">{v.model} ({v.vehicleType})</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owned Listings */}
                {userDetails?.listings && userDetails.listings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 mb-2 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" /> Owned Parking Spaces ({userDetails.listings.length})
                    </h4>
                    <div className="space-y-2">
                      {userDetails.listings.map((l) => (
                        <div key={l._id} className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-surface-900">{l.title}</p>
                            <p className="text-surface-500 text-[11px]">{l.address}, {l.city} • ₹{l.pricePerHour}/hr</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-200 text-surface-700'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block / Unblock Modal */}
      {blockModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleToggleBlockSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-200 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  blockModalUser.isBlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {blockModalUser.isBlocked ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900">
                  {blockModalUser.isBlocked ? 'Unblock User Account' : 'Suspend User Account'}
                </h3>
                <p className="text-xs text-surface-500">{blockModalUser.name} ({blockModalUser.email})</p>
              </div>
            </div>

            {!blockModalUser.isBlocked && (
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
                  Suspension Reason (Visible to user)
                </label>
                <textarea
                  required
                  rows="3"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, repeated dispute complaints, fraudulent listing."
                  className="w-full p-3 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            )}

            {blockModalUser.isBlocked && (
              <p className="text-xs text-surface-600">
                Unblocking this account will immediately restore login and booking privileges.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockModalUser(null)}
                className="px-4 py-2 border border-surface-200 text-surface-700 text-xs font-semibold rounded-xl hover:bg-surface-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={blockSubmitting}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition shadow-xs ${
                  blockModalUser.isBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {blockSubmitting
                  ? 'Saving...'
                  : blockModalUser.isBlocked
                  ? 'Confirm Unblock'
                  : 'Confirm Suspension'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
