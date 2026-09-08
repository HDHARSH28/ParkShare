import {
  processDirectPayment,
  handlePaymentFailure,
  createPaymentOrder,
  verifyPayment,
} from '../services/paymentService.js';

/**
 * @desc    Process direct payment (UPI / Card / NetBanking / Spot)
 * @route   POST /api/payments/process
 * @access  Private
 */
export const processPaymentHandler = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, transactionId } = req.body;
    const booking = await processDirectPayment(req.user._id || req.user.id, {
      bookingId,
      paymentMethod: paymentMethod || 'UPI',
      transactionId,
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed and QR entry pass issued!',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create payment order (compatible alias)
 * @route   POST /api/payments/create-order
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      const error = new Error('bookingId is required');
      error.statusCode = 400;
      throw error;
    }

    const orderData = await createPaymentOrder(bookingId, req.user._id || req.user.id);

    res.status(200).json({
      success: true,
      message: 'Payment order initialized',
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify payment and issue QR pass (compatible alias)
 * @route   POST /api/payments/verify
 * @access  Private
 */
export const verify = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, transactionId } = req.body;

    const booking = await verifyPayment(req.user._id || req.user.id, {
      bookingId,
      paymentMethod,
      transactionId,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and QR booking pass issued!',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle failed or cancelled payment to release spot hold
 * @route   POST /api/payments/fail
 * @access  Private
 */
export const failPaymentHandler = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;
    const booking = await handlePaymentFailure(req.user._id || req.user.id, {
      bookingId,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Payment marked as failed and parking slot released successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
