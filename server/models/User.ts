import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  referralCode?: string;
  role: "user" | "admin" | "superadmin";
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  ipAddress?: string;
  deviceInfo?: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWinnings: number;
  points: number;
  referredBy?: mongoose.Types.ObjectId;
  referredUsers: mongoose.Types.ObjectId[];
  
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
  winningBalance: number;
  kycStatus: "pending" | "verified" | "rejected";
  kycDocuments?: {
    aadharNumber?: string;
    panNumber?: string;
    bankAccount?: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
    };
  };
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [50, "Full name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    deviceInfo: {
      type: String,
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
    totalBets: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWinnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    points: {
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
winningBalance: {
  type: Number,
  default: 0,
  min: 0,
},

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    referredUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    kycDocuments: {
      aadharNumber: String,
      panNumber: String,
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
        bankName: String,
      },
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Index for admin queries
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });
UserSchema.index({ email: 1, mobile: 1 });

export default mongoose.model<IUser>("User", UserSchema);
