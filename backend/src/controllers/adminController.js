import {
  getDashboardStats,
  getUsersList,
  getUserDetails,
  toggleUserBlock,
  getHostsList,
  getAdminListings,
  updateListingStatus,
  deleteListingByAdmin,
  getAdminBookings,
  getAdminPayments,
  getAnalyticsData,
  getAdminReviews,
  deleteReviewByAdmin,
} from '../services/adminService.js';

export const getDashboardStatsHandler = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getUsersListHandler = async (req, res, next) => {
  try {
    const result = await getUsersList(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUserDetailsHandler = async (req, res, next) => {
  try {
    const details = await getUserDetails(req.params.id);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};

export const toggleUserBlockHandler = async (req, res, next) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const user = await toggleUserBlock(req.params.id, { isBlocked, blockReason });
    res.status(200).json({
      success: true,
      message: `User successfully ${isBlocked ? 'blocked' : 'unblocked'}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getHostsListHandler = async (req, res, next) => {
  try {
    const result = await getHostsList(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAdminListingsHandler = async (req, res, next) => {
  try {
    const result = await getAdminListings(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateListingStatusHandler = async (req, res, next) => {
  try {
    const { status, adminComment, isFlagged } = req.body;
    const listing = await updateListingStatus(req.params.id, { status, adminComment, isFlagged });
    res.status(200).json({
      success: true,
      message: 'Listing status updated successfully',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListingByAdminHandler = async (req, res, next) => {
  try {
    const listing = await deleteListingByAdmin(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Listing removed successfully by administrator',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminBookingsHandler = async (req, res, next) => {
  try {
    const result = await getAdminBookings(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAdminPaymentsHandler = async (req, res, next) => {
  try {
    const result = await getAdminPayments(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsDataHandler = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsData();
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getAdminReviewsHandler = async (req, res, next) => {
  try {
    const result = await getAdminReviews(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewByAdminHandler = async (req, res, next) => {
  try {
    const result = await deleteReviewByAdmin(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
