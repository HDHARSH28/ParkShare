import { User, Mail, Phone, Shield, Star, Calendar, CheckCircle, XCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  const roleColors = {
    DRIVER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    HOST: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  };

  const rc = roleColors[user?.role] || roleColors.DRIVER;

  const infoItems = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: user?.phone },
    { icon: Shield, label: 'Role', value: user?.role, badge: true },
    {
      icon: user?.isVerified ? CheckCircle : XCircle,
      label: 'Verification',
      value: user?.isVerified ? 'Verified' : 'Not Verified',
      statusColor: user?.isVerified ? 'text-emerald-600' : 'text-amber-600',
    },
    { icon: Star, label: 'Reliability Score', value: `${user?.reliabilityScore ?? 100}/100` },
    {
      icon: Calendar,
      label: 'Member Since',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '—',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-surface-900 mb-8">Profile</h1>

      {/* Avatar + Name Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden mb-6">
        <div className="h-28 bg-gradient-to-r from-primary-500 to-primary-700" />
        <div className="px-8 pb-8">
          <div className="-mt-14 flex items-end gap-5">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-surface-900">{user?.name}</h2>
              <span className={`inline-block mt-1 px-3 py-0.5 text-xs font-semibold rounded-full ${rc.bg} ${rc.text} ${rc.border} border`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-8">
        <h3 className="text-lg font-semibold text-surface-900 mb-6">Account Details</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          {infoItems.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl border border-surface-100"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-surface-200 shrink-0">
                <item.icon className={`w-5 h-5 ${item.statusColor || 'text-primary-500'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-700 uppercase tracking-wide">{item.label}</p>
                {item.badge ? (
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${rc.bg} ${rc.text}`}>
                    {item.value}
                  </span>
                ) : (
                  <p className={`text-sm font-medium mt-0.5 ${item.statusColor || 'text-surface-900'}`}>
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
