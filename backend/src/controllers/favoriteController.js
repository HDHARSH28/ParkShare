import {
  toggleFavorite,
  getMyFavorites,
  checkIsFavorite,
} from '../services/favoriteService.js';

export const toggle = async (req, res, next) => {
  try {
    const result = await toggleFavorite(req.user.id, req.params.parkingId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getMy = async (req, res, next) => {
  try {
    const favorites = await getMyFavorites(req.user.id);
    res.status(200).json({
      success: true,
      data: { favorites },
    });
  } catch (err) {
    next(err);
  }
};

export const check = async (req, res, next) => {
  try {
    const result = await checkIsFavorite(req.user.id, req.params.parkingId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
