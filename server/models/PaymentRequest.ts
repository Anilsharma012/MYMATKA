import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentRequest extends Document {
  userId: mongoose.Types.ObjectId;
  gatewayId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processing";

  // Payment proof details
  transactionId?: string;
  paymentProofUrl?: string;
  userNotes?: string;

  // Admin review details
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminNotes?: string;
  rejectionReason?: string;

  // System details
  ipAddress?: string;
  deviceInfo?: string;
  referenceId: string; // Unique reference for tracking

  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gatewayId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentGateway",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing"],
      default: "pending",
      index: true,
    },

    // Payment proof
    transactionId: {
      type: String,
      trim: true,
    },
    paymentProofUrl: {
      type: String,
      trim: true,
    },
    userNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Admin review
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // System details
    ipAddress: {
      type: String,
      trim: true,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for better query performance
PaymentRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
PaymentRequestSchema.index({ gatewayId: 1, status: 1, createdAt: -1 });
PaymentRequestSchema.index({ status: 1, createdAt: -1 });
PaymentRequestSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Generate unique reference ID before saving
PaymentRequestSchema.pre("save", function (next) {
  if (this.isNew && !this.referenceId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.referenceId = `PAY_${timestamp}_${randomStr}`.toUpperCase();
  }
  next();
});

// Alternative: Also ensure referenceId is set before validation
PaymentRequestSchema.pre("validate", function (next) {
  if (this.isNew && !this.referenceId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.referenceId = `PAY_${timestamp}_${randomStr}`.toUpperCase();
  }
  next();
});

// Auto-update reviewedAt when status changes to approved/rejected
PaymentRequestSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    (this.status === "approved" || this.status === "rejected") &&
    !this.reviewedAt
  ) {
    this.reviewedAt = new Date();
  }
  next();
});

export default mongoose.model<IPaymentRequest>(
  "PaymentRequest",
  PaymentRequestSchema,
);
