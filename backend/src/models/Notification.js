import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'BOOKING_CONFIRMATION',
  'PAYMENT_SUCCESS',
  'UPCOMING_BOOKING',
  'CANCELLATION',
  'CHECK_IN',
  'CHECK_OUT',
  'HOST_VERIFICATION',
  'REVIEW',
  'DISPUTE',
  'SMART_ADVISORY',
  'SYSTEM',
];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Notification type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export { NOTIFICATION_TYPES };
export default Notification;
