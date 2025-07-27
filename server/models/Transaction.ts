import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "commission";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  gameId?: string;
  gameName?: string;
  referenceId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "bet", "win", "bonus", "commission","credit"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    gameId: {
      type: String,
      index: true,
    },
    gameName: {
      type: String,
    },
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    closingBalance: {
  type: Number,
  required: false,
},

    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
    },
    adminNotes: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for better query performance
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, type: 1, createdAt: -1 });

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
