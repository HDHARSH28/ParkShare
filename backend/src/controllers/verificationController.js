import {
  submitVerification,
  getMyVerification,
  getAllVerifications,
  reviewVerification,
} from '../services/verificationService.js';

export const submit = async (req, res, next) => {
  try {
    const verification = await submitVerification(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Verification documents submitted successfully',
      data: { verification },
    });
  } catch (err) {
    next(err);
  }
};

export const getMy = async (req, res, next) => {
  try {
    const verification = await getMyVerification(req.user.id);
    res.status(200).json({
      success: true,
      data: { verification },
    });
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const result = await getAllVerifications(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const review = async (req, res, next) => {
  try {
    const verification = await reviewVerification(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Verification ${verification.status.toLowerCase()} successfully`,
      data: { verification },
    });
  } catch (err) {
    next(err);
  }
};
