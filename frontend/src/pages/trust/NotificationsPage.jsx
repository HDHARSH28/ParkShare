import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  CreditCard,
  XCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  Star,
  AlertTriangle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../../services/notificationService';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'PAYMENT_SUCCESS':
      return { icon: CreditCard, color: 'text-emerald-600 bg-emerald-100' };
    case 'BOOKING_CONFIRMATION':
      return { icon: Calendar, color: 'text-primary-600 bg-primary-100' };
    case 'CANCELLATION':
      return { icon: XCircle, color: 'text-red-600 bg-red-100' };
    case 'CHECK_IN':
      return { icon: LogIn, color: 'text-teal-600 bg-teal-100' };
    case 'CHECK_OUT':
      return { icon: LogOut, color: 'text-indigo-600 bg-indigo-100' };
    case 'HOST_VERIFICATION':
      return { icon: ShieldCheck, color: 'text-blue-600 bg-blue-100' };
    case 'REVIEW':
      return { icon: Star, color: 'text-amber-600 bg-amber-100' };
    case 'DISPUTE':
      return { icon: AlertTriangle, color: 'text-orange-600 bg-orange-100' };
    default:
      return { icon: Bell, color: 'text-surface-600 bg-surface-100' };
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'UNREAD' ? { isRead: 'false' } : {};
      const res = await getMyNotifications(params);
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-1">
            <Bell className="w-3.5 h-3.5" />
            Activity Center
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Notifications</h1>
          <p className="text-xs text-surface-600 mt-0.5">
            Real-time updates regarding reservations, check-ins, reviews, and account verifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 rounded-xl text-xs font-semibold transition"
            >
              <CheckCheck className="w-4 h-4 text-primary-600" />
              <span>Mark All Read</span>
            </button>
          )}

          <div className="inline-flex p-1 bg-surface-100 rounded-xl border border-surface-200 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'ALL'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'UNREAD'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-surface-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center mx-auto text-surface-400">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-surface-800 text-base">No Notifications</h3>
          <p className="text-xs text-surface-600 max-w-sm mx-auto">
            You're all caught up! New updates regarding bookings, payments, and reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const { icon: Icon, color } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkOne(notif._id)}
                className={`p-4 sm:p-5 rounded-2xl border transition flex items-start gap-4 ${
                  notif.isRead
                    ? 'bg-white border-surface-200'
                    : 'bg-primary-50/40 border-primary-200/80 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-surface-900 text-sm">{notif.title}</h3>
                    <span className="text-[11px] text-surface-600 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-surface-600 leading-relaxed">{notif.message}</p>

                  <div className="pt-2 flex items-center gap-3">
                    {notif.link && (
                      <Link
                        to={notif.link}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {!notif.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-primary-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
