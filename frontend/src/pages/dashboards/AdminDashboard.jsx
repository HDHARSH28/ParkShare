import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, QrCode, Search, CheckCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getAllVerifications } from '../../services/verificationService';
import { getAllDisputes } from '../../services/disputeService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [openDisputes, setOpenDisputes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [verifRes, disputeRes] = await Promise.all([
          getAllVerifications({ status: 'PENDING' }),
          getAllDisputes({ status: 'OPEN' }),
        ]);

        if (verifRes.success) {
          setPendingVerifications(verifRes.data?.verifications?.length || 0);
        }
        if (disputeRes.success) {
          setOpenDisputes(disputeRes.data?.disputes?.length || 0);
        }
      } catch (e) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const adminActions = [
    {
      icon: ShieldCheck,
      title: 'Host Verifications',
      desc: 'Review submitted host KYC documents. Approve or reject to grant listing publishing rights.',
      color: 'from-emerald-500 to-teal-600',
      badge: pendingVerifications > 0 ? `${pendingVerifications} Pending` : null,
      badgeColor: 'bg-amber-100 text-amber-700',
      link: '/verification',
      cta: 'Review Hosts →',
    },
    {
      icon: ShieldAlert,
      title: 'Disputes & Resolutions',
      desc: 'Investigate reported issues (occupied space, inaccessible gate, vehicle damage) and grant refunds.',
      color: 'from-rose-500 to-red-600',
      badge: openDisputes > 0 ? `${openDisputes} Open` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
      link: '/disputes',
      cta: 'Manage Disputes →',
    },
    {
      icon: QrCode,
      title: 'Host QR Scanner',
      desc: 'Verify digital QR booking passes, process check-ins and check-outs on behalf of hosts.',
      color: 'from-blue-500 to-indigo-600',
      link: '/host/scanner',
      cta: 'Launch Scanner →',
    },
    {
      icon: Search,
      title: 'Marketplace Directory',
      desc: 'Browse all published and unpublished parking listings across the platform.',
      color: 'from-purple-500 to-violet-600',
      link: '/parking',
      cta: 'Browse Spots →',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Admin Control Center</h1>
            <p className="text-surface-700 text-sm">Welcome back, {user?.name} 👋 (Administrator)</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Pending Verifications',
            value: loading ? '...' : `${pendingVerifications}`,
            sub: 'Awaiting KYC approval',
            urgent: pendingVerifications > 0,
          },
          {
            label: 'Open Disputes',
            value: loading ? '...' : `${openDisputes}`,
            sub: 'Requires arbitration',
            urgent: openDisputes > 0,
          },
          { label: 'Role Level', value: 'Root Admin', sub: 'Full platform privileges' },
          { label: 'System Status', value: 'Active', sub: 'Services fully operational' },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-5 shadow-sm ${
              s.urgent ? 'border-amber-300 bg-amber-50/20' : 'border-surface-200'
            }`}
          >
            <p className="text-xs text-surface-700 font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-surface-900 mt-1">{s.value}</p>
            <p className="text-xs text-surface-700 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Management Actions */}
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Trust & Platform Operations</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {adminActions.map((a, i) => (
          <Link
            key={i}
            to={a.link}
            className="group bg-white rounded-2xl border border-surface-200 p-6 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                >
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                {a.badge && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.badgeColor}`}>
                    {a.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-surface-900 text-base">{a.title}</h3>
              <p className="text-sm text-surface-700 mt-1">{a.desc}</p>
            </div>
            <p className="text-xs text-primary-600 font-semibold mt-4 flex items-center gap-1">
              {a.cta}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
