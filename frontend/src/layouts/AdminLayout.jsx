import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  ParkingSquare,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  Star,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getDashboardStats } from '../services/adminService';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Hosts', to: '/admin/hosts', icon: Home },
    { label: 'Parking Spaces', to: '/admin/parking', icon: ParkingSquare },
    { label: 'Bookings', to: '/admin/bookings', icon: CalendarDays },
    { label: 'Payments', to: '/admin/payments', icon: CreditCard },
    {
      label: 'Host KYC',
      to: '/admin/verification',
      icon: ShieldCheck,
      badge: stats?.pendingVerification > 0 ? stats.pendingVerification : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { label: 'Reviews', to: '/admin/reviews', icon: Star },
    {
      label: 'Disputes',
      to: '/admin/disputes',
      icon: ShieldAlert,
      badge: stats?.openDisputes > 0 ? stats.openDisputes : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-500/25">
              P
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">ParkShare</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block -mt-0.5">
                Admin Control
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer & Return to app */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-purple-400 truncate">Root Administrator</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <Link
              to="/parking"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main App</span>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-200 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-surface-200 text-surface-700 hover:bg-surface-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-surface-700 tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="p-2 text-surface-600 hover:text-surface-900 rounded-xl hover:bg-surface-100 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              to="/parking"
              className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-semibold rounded-xl transition"
            >
              Explore Marketplace →
            </Link>
          </div>
        </header>

        {/* Dynamic Admin Sub-Page */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
