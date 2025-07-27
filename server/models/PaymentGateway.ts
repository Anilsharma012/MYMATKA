import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentGateway extends Document {
  type: "upi" | "bank" | "crypto";
  name: string;
  displayName: string;
  isActive: boolean;

  // UPI specific fields
  upiId?: string;
  qrCodeUrl?: string;

  // Bank specific fields
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;

  // Crypto specific fields
  walletAddress?: string;
  network?: string;

  adminNotes?: string;
  minAmount?: number;
  maxAmount?: number;
  processingTime?: string; // e.g., "Instant", "1-2 hours"

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentGatewaySchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ["upi", "bank", "crypto"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // UPI fields
    upiId: {
      type: String,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },

    // Bank fields
    accountHolderName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    branchName: {
      type: String,
      trim: true,
    },

    // Crypto fields
    walletAddress: {
      type: String,
      trim: true,
    },
    network: {
      type: String,
      trim: true,
    },

    adminNotes: {
      type: String,
      trim: true,
    },
    minAmount: {
      type: Number,
      default: 10,
      min: 1,
    },
    maxAmount: {
      type: Number,
      default: 100000,
      min: 1,
    },
    processingTime: {
      type: String,
      default: "Instant",
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for better query performance
PaymentGatewaySchema.index({ type: 1, isActive: 1 });
PaymentGatewaySchema.index({ createdBy: 1, createdAt: -1 });

// Validation for UPI gateways
PaymentGatewaySchema.pre("save", function (next) {
  if (this.type === "upi" && !this.upiId) {
    next(new Error("UPI ID is required for UPI payment gateways"));
    return;
  }

  if (this.type === "bank") {
    if (
      !this.accountHolderName ||
      !this.accountNumber ||
      !this.ifscCode ||
      !this.bankName
    ) {
      next(new Error("Bank details are required for bank payment gateways"));
      return;
    }
  }

  if (this.type === "crypto" && !this.walletAddress) {
    next(new Error("Wallet address is required for crypto payment gateways"));
    return;
  }

  next();
});

export default mongoose.model<IPaymentGateway>(
  "PaymentGateway",
  PaymentGatewaySchema,
);
