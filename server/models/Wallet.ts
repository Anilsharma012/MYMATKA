import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalBets: number;
  isActive: boolean;
  lastUpdated: Date;
}

const WalletSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    winningBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWinnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBets: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate total balance before saving
WalletSchema.pre("save", function (next) {
  this.balance =
    (this.winningBalance as number) +
    (this.depositBalance as number) +
    (this.bonusBalance as number) +
    (this.commissionBalance as number);
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model<IWallet>("Wallet", WalletSchema);
