import mongoose from 'mongoose';

const VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const verificationDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: [
        'Government ID',
        'Electricity Bill',
        'Property Tax Receipt',
        'Rental Agreement',
        'Ownership Deed',
        'Other',
      ],
    },
    documentUrl: {
      type: String,
      required: [true, 'Document URL or upload reference is required'],
    },
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for verification'],
      unique: true,
      index: true,
    },
    documents: {
      type: [verificationDocumentSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one verification document must be provided',
      },
    },
    status: {
      type: String,
      enum: {
        values: VERIFICATION_STATUSES,
        message: `Status must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
      },
      default: 'PENDING',
      index: true,
    },
    adminComment: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Verification = mongoose.model('Verification', verificationSchema);

export { VERIFICATION_STATUSES };
export default Verification;
