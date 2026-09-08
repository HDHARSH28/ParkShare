import Verification from '../models/Verification.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';

/**
 * Host submits documents for verification
 */
export const submitVerification = async (userId, { documents }) => {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    const error = new Error('At least one verification document is required');
    error.statusCode = 400;
    throw error;
  }

  let verification = await Verification.findOne({ user: userId });

  if (verification) {
    verification.documents = documents;
    verification.status = 'PENDING';
    verification.adminComment = '';
    verification.submittedAt = new Date();
    verification.reviewedAt = null;
    verification.reviewedBy = null;
    await verification.save();
  } else {
    verification = await Verification.create({
      user: userId,
      documents,
      status: 'PENDING',
      submittedAt: new Date(),
    });
  }

  // Notify host
  await createNotification({
    userId,
    title: 'Verification Submitted',
    message: 'Your documents have been submitted to ParkShare Admin for identity verification.',
    type: 'HOST_VERIFICATION',
    link: '/verification',
  });

  return verification;
};

/**
 * Get current user's verification status
 */
export const getMyVerification = async (userId) => {
  const verification = await Verification.findOne({ user: userId })
    .populate('user', 'name email phone role isVerified')
    .populate('reviewedBy', 'name email');

  return verification;
};

/**
 * Admin: Get all verifications across the platform
 */
export const getAllVerifications = async (query = {}) => {
  const { status, limit = 20, page = 1 } = query;
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [verifications, total, pendingCount] = await Promise.all([
    Verification.find(filter)
      .populate('user', 'name email phone role isVerified createdAt')
      .populate('reviewedBy', 'name email')
      .sort('-submittedAt')
      .skip(skip)
      .limit(Number(limit)),
    Verification.countDocuments(filter),
    Verification.countDocuments({ status: 'PENDING' }),
  ]);

  return {
    verifications,
    total,
    pendingCount,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Admin: Approve or Reject a host's verification
 */
export const reviewVerification = async (adminId, verificationId, { status, adminComment = '' }) => {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    const error = new Error('Status must be either APPROVED or REJECTED');
    error.statusCode = 400;
    throw error;
  }

  const verification = await Verification.findById(verificationId);
  if (!verification) {
    const error = new Error('Verification request not found');
    error.statusCode = 404;
    throw error;
  }

  verification.status = status;
  verification.adminComment = adminComment;
  verification.reviewedAt = new Date();
  verification.reviewedBy = adminId;
  await verification.save();

  // Update User record's isVerified flag
  const isApproved = status === 'APPROVED';
  await User.findByIdAndUpdate(verification.user, { isVerified: isApproved });

  // Dispatch notification to host
  if (isApproved) {
    await createNotification({
      userId: verification.user,
      title: 'Host Verification Approved! 🎉',
      message: 'Congratulations! Your profile has been verified as a trusted host. You can now publish active parking spaces.',
      type: 'HOST_VERIFICATION',
      link: '/host/parking',
    });
  } else {
    await createNotification({
      userId: verification.user,
      title: 'Host Verification Needs Attention',
      message: `Your verification was not approved. Admin note: ${adminComment || 'Please re-submit clear documents.'}`,
      type: 'HOST_VERIFICATION',
      link: '/verification',
    });
  }

  await verification.populate('user', 'name email phone role isVerified');
  return verification;
};
