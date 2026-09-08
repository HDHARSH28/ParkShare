import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  Search,
  Calendar,
  Heart,
  Bell,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Building2,
  PlusCircle,
  QrCode,
  ShieldCheck,
  Star,
  AlertCircle,
  CheckCheck,
  ExternalLink,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import {
  getUnreadCount,
  getMyNotifications,
  markAllAsRead,
} from '../services/notificationService';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);

  // Refs for click outside
  const hostMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setShowHostMenu(false);
    setShowUserMenu(false);
    setShowNotifs(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Notifications polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hostMenuRef.current && !hostMenuRef.current.contains(e.target)) {
        setShowHostMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // quiet fail for polling
    }
  };

  const handleToggleNotifs = async () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);
    if (nextState) {
      try {
        const res = await getMyNotifications({ limit: 5 });
        if (res.success) {
          setRecentNotifs(res.data.notifications || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isRouteActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isHostActive = () =>
    location.pathname.startsWith('/host') ||
    location.pathname === '/verification' ||
    location.pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-all duration-200">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Park<span className="text-primary-600">Share</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">
                Smart Parking
              </span>
            </div>
          </Link>

          {/* Primary Navigation — Clean & Uncluttered */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* Find Parking */}
            <Link
              to="/parking"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isRouteActive('/parking')
                  ? 'bg-primary-50 text-primary-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Search className="w-4 h-4 text-primary-500" />
              <span>Find Parking</span>
            </Link>

            {/* My Bookings (Only if logged in) */}
            {isAuthenticated && (
              <Link
                to="/bookings"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isRouteActive('/bookings')
                    ? 'bg-primary-50 text-primary-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>My Bookings</span>
              </Link>
            )}

            {/* Host Hub Dropdown (For Hosts) */}
            {isAuthenticated && user?.role === 'HOST' && (
              <div className="relative" ref={hostMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowHostMenu(!showHostMenu)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isHostActive() || showHostMenu
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Host Hub</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showHostMenu ? 'rotate-180 text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Host Hub Dropdown Card */}
                {showHostMenu && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Host Management
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/host/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700 shrink-0">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            Host Dashboard
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Overview, earnings & stats
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/host/parking"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            My Parking Spaces
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Manage listings & pricing
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/host/parking/add"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-100/80 flex items-center justify-center text-teal-700 shrink-0">
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            List a New Spot
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Publish parking to drivers
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/host/bookings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100/80 flex items-center justify-center text-blue-700 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            Reservations
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Upcoming driver bookings
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/host/scanner"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100/80 flex items-center justify-center text-indigo-700 shrink-0">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            QR Pass Scanner
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Instant check-in / check-out
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/verification"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs leading-none text-slate-900">
                            Host Verification
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            KYC status & verified badge
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Console Shortcut (Only if Admin) */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isRouteActive('/admin')
                    ? 'bg-indigo-100 text-indigo-800 shadow-xs'
                    : 'text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/70'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Become a Host prompt (for drivers or unverified users) */}
            {isAuthenticated && user?.role === 'DRIVER' && (
              <Link
                to="/verification"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Become a Host</span>
              </Link>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* Saved Spots Bookmark Icon */}
                <Link
                  to="/favorites"
                  className={`p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                    isRouteActive('/favorites') ? 'bg-rose-50 text-rose-600' : ''
                  }`}
                  title="Saved Parking Spots"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isRouteActive('/favorites') ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={handleToggleNotifs}
                    className={`p-2.5 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-100 relative transition-colors ${
                      showNotifs ? 'bg-slate-100 text-primary-600' : ''
                    }`}
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Menu */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                          <Bell className="w-4 h-4 text-primary-600" />
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-[10px]">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {recentNotifs.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">No new notifications</p>
                          </div>
                        ) : (
                          recentNotifs.map((n) => (
                            <Link
                              key={n._id}
                              to={n.link || '/notifications'}
                              onClick={() => setShowNotifs(false)}
                              className={`p-3 block hover:bg-slate-50 transition ${
                                !n.isRead ? 'bg-primary-50/40' : ''
                              }`}
                            >
                              <div className="flex justify-between items-baseline gap-1 mb-0.5">
                                <span className="font-bold text-slate-900 truncate">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifs(false)}
                          className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5"
                        >
                          <span>View All Activity</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Account Menu (Replaces ugly demoh text & raw logout button) */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 pr-0.5 transition-transform duration-200 ${
                        showUserMenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Rich User Profile Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 truncate">
                              {user?.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                          </div>
                        </div>

                        {/* Status Badge & Reliability */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                              user?.role === 'HOST'
                                ? 'bg-emerald-100 text-emerald-800'
                                : user?.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user?.role}
                          </span>
                          {user?.isVerified && (
                            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium ml-auto flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            {user?.reliabilityScore ?? 100}%
                          </span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1.5 text-xs font-medium text-slate-700">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile & Vehicles</span>
                        </Link>

                        <Link
                          to="/bookings"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>My Bookings</span>
                        </Link>

                        <Link
                          to="/favorites"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Saved Spots</span>
                        </Link>

                        <Link
                          to="/reviews"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>Reviews & Ratings</span>
                        </Link>

                        <Link
                          to="/disputes"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span>Help & Disputes</span>
                        </Link>

                        {/* Host Tools in Profile Dropdown for quick access */}
                        {user?.role === 'HOST' && (
                          <div className="border-t border-slate-100 my-1 pt-1">
                            <Link
                              to="/host/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span>Host Dashboard</span>
                            </Link>
                            <Link
                              to="/host/scanner"
                              className="flex items-center gap-2.5 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Scan Driver Pass</span>
                            </Link>
                          </div>
                        )}

                        {/* Admin Tools in Profile Dropdown */}
                        {user?.role === 'ADMIN' && (
                          <div className="border-t border-slate-100 my-1 pt-1">
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Admin Operations</span>
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Sign Out Button */}
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Public / Guest Controls */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition-all shadow-primary-500/20 hover:shadow-md"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Organized in Logical Sections) */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-800 rounded-md text-[10px] font-bold uppercase">
                {user?.role}
              </span>
            </div>
          )}

          {/* Section 1: Explore & Book */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Explore & Book
            </p>
            <Link
              to="/parking"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Search className="w-4 h-4 text-primary-600" />
              <span>Find Parking</span>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/bookings"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>My Bookings</span>
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Saved Spots</span>
                </Link>
                <Link
                  to="/reviews"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Reviews & Ratings</span>
                </Link>
              </>
            )}
          </div>

          {/* Section 2: Host Management (if Host) */}
          {isAuthenticated && user?.role === 'HOST' && (
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider px-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Host Management
              </p>
              <Link
                to="/host/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Host Dashboard</span>
              </Link>
              <Link
                to="/host/parking"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>My Listings</span>
              </Link>
              <Link
                to="/host/parking/add"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>List a New Spot</span>
              </Link>
              <Link
                to="/host/scanner"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Scan Driver QR Pass</span>
              </Link>
              <Link
                to="/verification"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Host Verification</span>
              </Link>
            </div>
          )}

          {/* Section 3: Admin Console (if Admin) */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider px-2">
                Operations
              </p>
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            </div>
          )}

          {/* Section 4: Account & Support */}
          {isAuthenticated ? (
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Account & Settings
              </p>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Profile & Vehicles</span>
              </Link>
              <Link
                to="/notifications"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
              </Link>
              <Link
                to="/disputes"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Help & Disputes</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="w-full py-2.5 text-center text-sm font-semibold text-white bg-primary-600 rounded-xl shadow-xs"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
