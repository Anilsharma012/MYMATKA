import mongoose, { Schema, Document } from "mongoose";

export interface IBet extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  gameResultId?: mongoose.Types.ObjectId;

  // Game Information
  gameName: string;
  gameType: "jodi" | "haruf" | "crossing";
  betType: "jodi" | "haruf" | "crossing";



 


  // Bet Details
  betNumber: string; // The number(s) user bet on
  betAmount: number;
  potentialWinning: number; // Calculated at bet time

  // Additional Bet Data
  betData?: {
    // For Jodi: full 2-digit number
    jodiNumber?: string;
    // For Haruf: single digit and position (first/last)
    harufDigit?: string;
    harufPosition?: "first" | "last";
    // For Crossing: special crossing combination
    crossingCombination?: string;
     originalInput: String,
  };

  // Result Information
  isWinner?: boolean;
  winningAmount?: number;
  actualPayout?: number;


    // Result Meta
  isWinning?: boolean;
  resultDeclared?: boolean;
  resultDeclaredAt?: Date;
  declaredResult?: string;


  // Status
  status: "pending" | "won" | "lost" | "cancelled" | "refunded";

  // Timing
  betPlacedAt: Date;
  gameDate: Date; // Date for which this bet is placed
  gameTime: string; // Game time (HH:mm)

  // Transaction
  deductionTransactionId?: mongoose.Types.ObjectId;
  winningTransactionId?: mongoose.Types.ObjectId;

  // System Data
  ipAddress?: string;
  deviceInfo?: string;

  createdAt: Date;
  updatedAt: Date;
}

const BetSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    

    gameResultId: {
      type: Schema.Types.ObjectId,
      ref: "GameResult",
      index: true,
    },

    // Game Information
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
    betType: {
      type: String,
      enum: ["jodi", "haruf", "crossing"],
      required: true,
      index: true,
    },
    drawTime: {
      type: String,
      default: "06:00",
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // Bet Details
    betNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    
    result: { type: String },

    
    betAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    potentialWinning: {
      type: Number,
      required: true,
      min: 0,
    },

    // Additional Bet Data
    betData: {
      jodiNumber: {
        type: String,
        match: /^[0-9]{2}$/,
      },
      harufDigit: {
        type: String,
        match: /^[0-9]$/,
      },
      harufPosition: {
        type: String,
        enum: ["first", "last"],
      },
      crossingCombination: {
        type: String,
        trim: true,
      },

        originalInput: {           // ✅ ✅ ✅ Add this line here inside betData
    type: String,
    trim: true,
  },
    },

    // Result Information
    isWinner: {
      type: Boolean,
      index: true,
    },
    winningAmount: { type: Number, default: 0, min: 0 }
,
    actualPayout: {
      type: Number,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "won", "lost", "cancelled", "refunded", "declared"],
      default: "pending",
      index: true,
    },
    isWinning: {
      type: Boolean,
      default: false,
    },
    resultDeclared: {
      type: Boolean,
      default: false,
    },
    resultDeclaredAt: {
      type: Date,
    },
    declaredResult: {
      type: String,
    },

    // Timing
    betPlacedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    gameDate: {
      type: Date,
      required: true,
      index: true,
    },
    gameTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // Transaction
    deductionTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
    winningTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },

    // System Data
    ipAddress: {
      type: String,
      trim: true,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for better query performance
BetSchema.index({ userId: 1, gameDate: -1, status: 1 });
BetSchema.index({ gameId: 1, gameDate: 1, betType: 1 });
BetSchema.index({ gameResultId: 1, status: 1 });
BetSchema.index({ betNumber: 1, gameDate: 1, gameType: 1 });
BetSchema.index({ status: 1, betPlacedAt: -1 });

// Pre-save hook to calculate potential winning
// Pre-save hook to calculate potential winning
BetSchema.pre("save", async function (next) {
  if (this.isNew && !this.potentialWinning) {
    try {
      const Game = mongoose.model("Game");
      const game = await Game.findById(this.gameId);

      if (game) {
        let multiplier = 1;
        switch (this.betType) {
          case "jodi":
            multiplier = game.jodiPayout;
            break;
          case "haruf":
            multiplier = game.harufPayout;
            break;
          case "crossing":
            multiplier = game.crossingPayout;
            break;
        }

        if (
          typeof this.betAmount === "number" &&
          typeof multiplier === "number"
        ) {
          this.potentialWinning = this.betAmount * multiplier;
        } else {
          this.potentialWinning = 0;
        }
      }
    } catch (error) {
      console.error("Error calculating potential winning:", error);
    }
  }
  next();
});

export default mongoose.model<IBet>("Bet", BetSchema);
