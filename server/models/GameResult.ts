import mongoose, { Schema, Document } from "mongoose";

export interface IGameResult extends Document {
  gameId: mongoose.Types.ObjectId;
  gameName: string;
  gameType: "jodi" | "haruf" | "crossing";

  // Result Data
  resultDate: Date;
  drawTime: string; // HH:mm format

  // Winning Numbers
  jodiResult?: string; // 2-digit number (00-99)
  harufResult?: string; // 1-digit number (0-9)
  crossingResult?: string; // Special crossing result

  // Statistics
  totalBets: number;
  totalBetAmount: number;
  totalWinningAmount: number;
  platformCommission: number;
  netProfit: number; // Platform profit after payouts

  // Bet Distribution
  betDistribution: {
    jodi: {
      totalBets: number;
      totalAmount: number;
      winningBets: number;
      winningAmount: number;
    };
    haruf: {
      totalBets: number;
      totalAmount: number;
      winningBets: number;
      winningAmount: number;
    };
    crossing: {
      totalBets: number;
      totalAmount: number;
      winningBets: number;
      winningAmount: number;
    };
  };

  // Status
  status: "pending" | "declared" | "processed" | "cancelled";
  isManual: boolean; // Was result declared manually or auto-generated

  // Administrative
  declaredBy?: mongoose.Types.ObjectId;
  declaredAt?: Date;
  processedAt?: Date; // When winnings were distributed

  createdAt: Date;
  updatedAt: Date;
}

const GameResultSchema: Schema = new Schema(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    gameName: {
      type: String,
      required: true,
      trim: true,
    },
    gameType: {
      type: String,
      enum: ["jodi", "haruf", "crossing"],
      required: true,
      index: true,
    },

    // Result Data
    resultDate: {
      type: Date,
      required: true,
      index: true,
    },
    drawTime: {
      type: String,
      required: false,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // Winning Numbers
    jodiResult: {
      type: String,
      match: /^[0-9]{2}$/,
      index: true,
    },
    harufResult: {
      type: String,
      match: /^[0-9]$/,
      index: true,
    },
    crossingResult: {
      type: String,
      trim: true,
    },

    // Statistics
    totalBets: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBetAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWinningAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },

    // Bet Distribution
    betDistribution: {
      jodi: {
        totalBets: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        winningBets: { type: Number, default: 0 },
        winningAmount: { type: Number, default: 0 },
      },
      haruf: {
        totalBets: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        winningBets: { type: Number, default: 0 },
        winningAmount: { type: Number, default: 0 },
      },
      crossing: {
        totalBets: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        winningBets: { type: Number, default: 0 },
        winningAmount: { type: Number, default: 0 },
      },
    },
    result: {
      jodi: {
        type: String,
        match: /^[0-9]{2}$/,
      },
      haruf: {
        type: String,
        match: /^[0-9]{2}$/,
      },
      crossing: {
        type: String,
        match: /^[0-9]{2}$/,
      },
      fallback: {
        type: String,
        match: /^[0-9]{2}$/,
      },
    },

    
    status: {
      type: String,
      enum: ["pending", "declared", "processed", "cancelled"],
      default: "pending",
      index: true,
    },
    isManual: {
      type: Boolean,
      default: true,
    },

    // Administrative
    declaredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    declaredAt: {
      type: Date,
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
GameResultSchema.index({ gameId: 1, resultDate: -1 });
GameResultSchema.index({ resultDate: -1, status: 1 });
GameResultSchema.index({ gameType: 1, resultDate: -1 });

export default mongoose.model<IGameResult>("GameResult", GameResultSchema);
