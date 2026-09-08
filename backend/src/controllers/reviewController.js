import {
  createReview,
  getParkingReviews,
  getHostReviews,
  getMyReviewsData,
} from '../services/reviewService.js';

export const create = async (req, res, next) => {
  try {
    const result = await createReview(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getByParking = async (req, res, next) => {
  try {
    const result = await getParkingReviews(req.params.parkingId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getByHost = async (req, res, next) => {
  try {
    const result = await getHostReviews(req.params.hostId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getMy = async (req, res, next) => {
  try {
    const result = await getMyReviewsData(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
