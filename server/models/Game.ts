import mongoose, { Schema, Document } from "mongoose";

export interface IGame extends Document {
  name: string;
  type: "jodi" | "haruf" | "crossing";
  description: string;
  isActive: boolean;

  
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  resultTime: string; // HH:mm format
  timezone: string;
   drawTime: string;

  // Game Configuration
  minBet: number;
  maxBet: number;
  commission: number; // Percentage for platform

  // Payout Rates
  jodiPayout: number; // e.g., 95 (95:1)
  harufPayout: number; // e.g., 9 (9:1)
  crossingPayout: number; // e.g., 180 (180:1)


  result?: {
    jodi: string;
    haruf: string;
    crossing: string;
  };

  // Crossing Game Rules (if applicable)
  crossingRules?: {
    ruleType: "auto" | "manual";
    autoLogic?: string; // JSON string of logic
    manualRules?: string; // Admin defined rules
  };

  // 🧩 Unified Result Declaration System
  declaredResult?: string; // Single winning number for all bet types
  resultDeclaredAt?: Date; // When result was declared
  resultDeclaredBy?: mongoose.Types.ObjectId; // Admin who declared (if manual)
  autoResultScheduled?: Date; // When auto result is scheduled (24 hours after endTime)
  isResultPending?: boolean; // Whether result declaration is pending
  resultMethod?: "manual" | "automatic"; // How result was declared

  // Status
  currentStatus: "waiting" | "open" | "closed" | "result_declared";
  forcedStatus?: "waiting" | "open" | "closed" | "result_declared";
  lastResultDate?: Date;
  lastStatusChange?: Date;

  // Administrative
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["jodi", "haruf", "crossing"],
      required: false,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Timing
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    resultTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    drawTime: {
  type: String,
  required: false,
  match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
},
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // Game Configuration
    minBet: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
    maxBet: {
      type: Number,
      required: true,
      min: 1,
      default: 10000,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 5, // 5%
    },
      originalInput: String, 

    // Payout Rates
    jodiPayout: {
      type: Number,
      default: 95,
      min: 1,
    },
    harufPayout: {
      type: Number,
      default: 9,
      min: 1,
    },
    crossingPayout: {
      type: Number,
      default: 95,
      min: 1,
    },

    // Crossing Game Rules
    crossingRules: {
      ruleType: {
        type: String,
        enum: ["auto", "manual"],
        default: "auto",
      },
      autoLogic: {
        type: String, // JSON string
      },
      manualRules: {
        type: String,
      },
    },

    // 🧩 Unified Result Declaration System
    declaredResult: {
      type: String,
      trim: true,
      index: true,
    },
    result: {
      jodi: { type: String, trim: true },
      haruf: { type: String, trim: true },
      crossing: { type: String, trim: true },
    },
    
    
    resultDeclaredAt: {
      type: Date,
      index: true,
    },
    resultDeclaredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    autoResultScheduled: {
      type: Date,
      index: true,
    },
    isResultPending: {
      type: Boolean,
      default: false,
      index: true,
    },
    resultMethod: {
      type: String,
      enum: ["manual", "automatic"],
    },

    // Status
    currentStatus: {
      type: String,
      enum: ["waiting", "open", "closed", "result_declared"],
      default: "waiting",
      index: true,
    },
    forcedStatus: {
      type: String,
      enum: ["waiting", "open", "closed", "result_declared"],
    },
    lastResultDate: {
      type: Date,
    },
    lastStatusChange: {
      type: Date,
    },

    // Administrative
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

// Indexes for better performance
GameSchema.index({ type: 1, isActive: 1, currentStatus: 1 });
GameSchema.index({ startTime: 1, endTime: 1 });
GameSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model<IGame>("Game", GameSchema);
