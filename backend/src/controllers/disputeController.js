import {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  resolveDispute,
} from '../services/disputeService.js';
import { validateCreateDispute } from '../validators/disputeValidator.js';

export const create = async (req, res, next) => {
  try {
    const errors = validateCreateDispute(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', '),
        errors,
      });
    }

    const dispute = await createDispute(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Dispute filed successfully. Our admin team will investigate.',
      data: { dispute },
    });
  } catch (err) {
    next(err);
  }
};

export const getMy = async (req, res, next) => {
  try {
    const disputes = await getMyDisputes(req.user.id);
    res.status(200).json({
      success: true,
      data: { disputes },
    });
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const result = await getAllDisputes(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const resolve = async (req, res, next) => {
  try {
    const dispute = await resolveDispute(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Dispute status updated successfully',
      data: { dispute },
    });
  } catch (err) {
    next(err);
  }
};
