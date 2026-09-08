import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getMyVerification,
  submitVerification,
  getAllVerifications,
  reviewVerification,
} from '../../services/verificationService';
import useAuth from '../../hooks/useAuth';

const DOCUMENT_TYPES = [
  'Government ID',
  'Electricity Bill',
  'Property Tax Receipt',
  'Rental Agreement',
  'Ownership Deed',
  'Other',
];

const HostVerification = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Host state
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Document form fields
  const [documents, setDocuments] = useState([
    { documentType: 'Government ID', documentUrl: '', documentNumber: '' },
  ]);

  // Admin state
  const [adminVerifications, setAdminVerifications] = useState([]);
  const [adminFilter, setAdminFilter] = useState('ALL');
  const [reviewModal, setReviewModal] = useState(null); // verification to review
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [adminComment, setAdminComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadData();
  }, [isAdmin, adminFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (isAdmin) {
        const res = await getAllVerifications({ status: adminFilter });
        if (res.success) {
          setAdminVerifications(res.data.verifications || []);
        }
      } else {
        const res = await getMyVerification();
        if (res.success) {
          setVerification(res.data.verification);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load verification records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoc = () => {
    setDocuments([
      ...documents,
      { documentType: 'Property Tax Receipt', documentUrl: '', documentNumber: '' },
    ]);
  };

  const handleRemoveDoc = (index) => {
    if (documents.length <= 1) return;
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleDocChange = (index, field, value) => {
    const updated = [...documents];
    updated[index][field] = value;
    setDocuments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Quick validation
    const invalidDoc = documents.find((d) => !d.documentUrl.trim());
    if (invalidDoc) {
      setError('Please provide a document URL or file path for each document');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitVerification({ documents });
      if (res.success) {
        setVerification(res.data.verification);
        setSuccessMsg('Verification documents submitted successfully! Admin will review soon.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;

    try {
      setReviewing(true);
      const res = await reviewVerification(reviewModal._id, {
        status: reviewStatus,
        adminComment,
      });
      if (res.success) {
        setReviewModal(null);
        setAdminComment('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Queue View */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                Admin Console
              </div>
              <h1 className="text-2xl font-bold text-surface-900">Host Verification Queue</h1>
              <p className="text-xs text-surface-600 mt-0.5">
                Review host property documents and approve or reject listing privileges.
              </p>
            </div>

            {/* Filter */}
            <div className="inline-flex p-1 bg-surface-100 rounded-xl border border-surface-200 text-xs font-semibold">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAdminFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    adminFilter === st
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {adminVerifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-surface-200 shadow-sm">
              <FileCheck className="w-12 h-12 text-surface-400 mx-auto mb-3" />
              <h3 className="font-bold text-surface-800">No verifications found</h3>
              <p className="text-xs text-surface-600 mt-1">
                There are no verification requests matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {adminVerifications.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-surface-900 text-base">
                        {item.user?.name || 'Host'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-surface-600">
                      Email: {item.user?.email} • Phone: {item.user?.phone}
                    </p>
                    <p className="text-xs text-surface-500">
                      Submitted: {new Date(item.submittedAt).toLocaleString('en-IN')}
                    </p>

                    {/* Documents */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {item.documents?.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-lg text-xs font-medium text-surface-700 transition"
                        >
                          <ExternalLink className="w-3 h-3 text-primary-600" />
                          <span>{doc.documentType}</span>
                          {doc.documentNumber && (
                            <span className="font-mono text-[10px] text-surface-500">
                              ({doc.documentNumber})
                            </span>
                          )}
                        </a>
                      ))}
                    </div>

                    {item.adminComment && (
                      <p className="text-xs text-surface-600 pt-1">
                        <span className="font-semibold">Admin Comment:</span> {item.adminComment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => {
                        setReviewModal(item);
                        setReviewStatus('APPROVED');
                        setAdminComment(item.adminComment || '');
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Review & Decide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin Review Modal */}
          {reviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-base text-surface-900">
                  Review Verification: {reviewModal.user?.name}
                </h3>

                <form onSubmit={handleAdminReview} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">Decision</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStatus('APPROVED')}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                          reviewStatus === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-surface-200 text-surface-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewStatus('REJECTED')}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                          reviewStatus === 'REJECTED'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-surface-200 text-surface-700'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-surface-700 block mb-1">
                      Admin Feedback / Comment
                    </label>
                    <textarea
                      rows={3}
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="e.g. Identity verified. Electricity bill matched address."
                      className="w-full px-3 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewModal(null)}
                      className="px-4 py-2 border border-surface-200 rounded-xl font-semibold text-surface-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewing}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                      {reviewing ? 'Saving...' : 'Submit Decision'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Host Verification View */
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4" />
              ParkShare Trust & Safety
            </div>
            <h1 className="text-3xl font-bold text-surface-900">Host Identity Verification</h1>
            <p className="text-surface-600 text-xs sm:text-sm mt-1">
              Verify your identity and parking ownership documents to earn the{' '}
              <span className="font-bold text-primary-700">✓ Verified Host</span> badge and unlock
              public listing privileges.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Status Banner */}
          {verification?.status === 'APPROVED' && (
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">
                ✓ Verified Host
              </div>
              <h2 className="text-xl font-bold text-surface-900">Your Account is Fully Verified!</h2>
              <p className="text-xs text-surface-600 max-w-md mx-auto">
                All submitted documents have been approved by ParkShare Admin. Your listings will
                proudly display the Verified Host badge to nearby drivers.
              </p>
              {verification.reviewedAt && (
                <p className="text-[11px] text-surface-600">
                  Approved on {new Date(verification.reviewedAt).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          )}

          {verification?.status === 'PENDING' && (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 text-base">
                    Documents Under Admin Review
                  </h3>
                  <p className="text-xs text-amber-800">
                    Your verification was submitted on{' '}
                    {new Date(verification.submittedAt).toLocaleString('en-IN')}. Our compliance team
                    typically reviews files within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {verification?.status === 'REJECTED' && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 text-base">Verification Needs Attention</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    {verification.adminComment ||
                      'Submitted documents could not be validated. Please provide updated files below.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Form (Shown if NOT_SUBMITTED or REJECTED) */}
          {(!verification || verification.status === 'REJECTED') && (
            <div className="bg-white rounded-3xl border border-surface-200 shadow-sm p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-600" />
                Upload Verification Documents
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-surface-700">Document #{idx + 1}</span>
                        {documents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="font-semibold text-surface-700 block mb-1">
                            Document Type
                          </label>
                          <select
                            value={doc.documentType}
                            onChange={(e) => handleDocChange(idx, 'documentType', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          >
                            {DOCUMENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-surface-700 block mb-1">
                            Document ID / Number (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TAX-2026-XXXX"
                            value={doc.documentNumber}
                            onChange={(e) => handleDocChange(idx, 'documentNumber', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-surface-700 block mb-1">
                            Document File Link / URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://... or sample URL"
                            value={doc.documentUrl}
                            onChange={(e) => handleDocChange(idx, 'documentUrl', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-surface-200 text-surface-700 hover:bg-surface-50 rounded-xl text-xs font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> Add Another Document
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Documents...' : 'Submit for Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 text-xs space-y-1">
              <div className="font-bold text-surface-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary-600" />
                256-Bit Encrypted
              </div>
              <p className="text-surface-600 text-[11px]">
                Your personal IDs and bills are strictly accessible only by ParkShare compliance staff.
              </p>
            </div>

            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 text-xs space-y-1">
              <div className="font-bold text-surface-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Verified Badge
              </div>
              <p className="text-surface-600 text-[11px]">
                Approved hosts display the verified checkmark and get higher search positioning.
              </p>
            </div>

            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 text-xs space-y-1">
              <div className="font-bold text-surface-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                Listing Activation
              </div>
              <p className="text-surface-600 text-[11px]">
                Publish active listings and start accepting driver reservations immediately upon approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostVerification;
