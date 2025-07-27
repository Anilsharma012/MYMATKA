import { RequestHandler } from "express";
import mongoose from "mongoose";
import { getCrossingCombinations } from "../scripts/crossingUtils";
import Game from "../models/Game";
import GameResult from "../models/GameResult";
import { HydratedDocument } from "mongoose";
import { checkBetWinning } from "../scripts/checkBetWinning";

import Bet, { IBet } from "../models/Bet";
import Wallet, { IWallet } from "../models/Wallet";
import Transaction from "../models/Transaction";
import User from "../models/User";
import { AdminRequest } from "../middleware/adminAuth";
import { IGame } from "../models/Game";

// Get all games (public - for users to see available games)
export const getAllGames: RequestHandler = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .select("-createdBy -__v")
      .sort({ startTime: 1 });

    // Add current game status based on time or forced status
    const gamesWithStatus = games.map((game) => {
      // If admin has forced a status, use that
      if (game.forcedStatus && game.isActive) {
        return {
          ...game.toObject(),
          currentStatus: game.forcedStatus,
        };
      }

      // Otherwise calculate based on time with proper cross-day handling
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      // Helper function to convert HH:mm to minutes for comparison
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentMinutes = timeToMinutes(currentTime);
      const startMinutes = timeToMinutes(game.startTime);
      const endMinutes = timeToMinutes(game.endTime);
      const resultMinutes = timeToMinutes(game.resultTime);

      let status = "waiting";
      if (game.isActive) {
        // Handle cross-day scenarios (when end time is next day)
        let isGameOpen = false;
        let isGameClosed = false;
        let isResultTime = false;

        if (endMinutes > startMinutes) {
          // Same day game (e.g., 08:00 to 15:30)
          isGameOpen =
            currentMinutes >= startMinutes && currentMinutes < endMinutes;
          isGameClosed =
            currentMinutes >= endMinutes && currentMinutes < resultMinutes;
          isResultTime = currentMinutes >= resultMinutes;
        } else {
          // Cross-day game (e.g., 08:00 to 03:30 next day)
          isGameOpen =
            currentMinutes >= startMinutes || currentMinutes < endMinutes;

          if (resultMinutes > endMinutes) {
            // Result is same day as end time
            isGameClosed =
              currentMinutes >= endMinutes && currentMinutes < resultMinutes;
            isResultTime =
              currentMinutes >= resultMinutes && currentMinutes < startMinutes;
          } else {
            // Result is next day after end time
            isGameClosed =
              (currentMinutes >= endMinutes && currentMinutes < 1440) ||
              (currentMinutes >= 0 && currentMinutes < resultMinutes);
            isResultTime =
              currentMinutes >= resultMinutes && currentMinutes < startMinutes;
          }
        }

        if (isGameOpen) {
          status = "open";
        } else if (isGameClosed) {
          status = "closed";
        } else if (isResultTime) {
          status = "result_declared";
        }
      }

      return {
        ...game.toObject(),
        currentStatus: status,
      };
    });

    res.json({
      success: true,
      data: gamesWithStatus,
    });
  } catch (error) {
    console.error("Get all games error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get specific game by ID or name
export const getGameById: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    let game;
    // Check if gameId is a valid ObjectId (24 character hex string)
    if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId, search by _id
      game = await Game.findById(gameId);
    } else {
      // It's not a valid ObjectId, search by name (case-insensitive)
      game = await Game.findOne({
        name: { $regex: new RegExp(gameId.replace(/-/g, " "), "i") },
      });
    }

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    if (!game.isActive) {
      res.status(404).json({ message: "Game is not active" });
      return;
    }

    // Calculate current status
    let currentStatus = "";
    if (game.forcedStatus && game.isActive) {
      currentStatus = game.forcedStatus;
    } else if (game.isActive) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      if (currentTime >= game.startTime && currentTime < game.endTime) {
        currentStatus = "open";
      } else if (currentTime >= game.endTime && currentTime < game.resultTime) {
        currentStatus = "closed";
      } else if (currentTime >= game.resultTime) {
        currentStatus = "result_declared";
      } else {
        currentStatus = "waiting";
      }
    } else {
      currentStatus = "waiting";
    }

    res.json({
      success: true,
      data: {
        ...game.toObject(),
        currentStatus,
      },
    });
  } catch (error) {
    console.error("Get game by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Place a bet (authenticated users) - Atomic operation with transaction
export const placeBet: RequestHandler = async (req, res) => {
  console.log("=== PLACE BET API CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("User ID:", (req as any).user?._id);

  // Start a database session for atomic transactions
  const session = await mongoose.startSession();

  try {
    const { gameId, betType, betNumber, betAmount, betData } = req.body;
    const userId = (req as any).user._id;
    const userEmail = (req as any).user.email;

    // Validate required fields
    if (!gameId || !betType || !betNumber || !betAmount) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: gameId, betType, betNumber, betAmount",
      });
    }

    if (betAmount <= 0) {
      console.log("❌ Invalid bet amount:", betAmount);
      return res.status(400).json({
        success: false,
        message: "Bet amount must be greater than 0",
      });
    }

    // Get game details
    const game = (await Game.findById(gameId)) as IGame;

    if (!game || !game.isActive) {
      console.log("❌ Game not found or inactive");
      return res.status(404).json({
        success: false,
        message: "Game not found or inactive",
      });
    }

    // Check if game is open for betting (respect admin forced status)
    let gameStatus = "";

    if (game.forcedStatus && game.isActive) {
      // Admin has forced a status
      gameStatus = game.forcedStatus;
      console.log("🎯 Using admin forced status:", gameStatus);
    } else if (game.isActive) {
      // Calculate based on time with proper cross-day handling
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      // Helper function to convert HH:mm to minutes for comparison
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentMinutes = timeToMinutes(currentTime);
      const startMinutes = timeToMinutes(game.startTime);
      const endMinutes = timeToMinutes(game.endTime);
      const resultMinutes = timeToMinutes(game.resultTime);

      // Handle cross-day scenarios (when end time is next day)
      let isGameOpen = false;
      let isGameClosed = false;
      let isResultTime = false;

      if (endMinutes > startMinutes) {
        // Same day game (e.g., 08:00 to 15:30)
        isGameOpen =
          currentMinutes >= startMinutes && currentMinutes < endMinutes;
        isGameClosed =
          currentMinutes >= endMinutes && currentMinutes < resultMinutes;
        isResultTime = currentMinutes >= resultMinutes;
      } else {
        // Cross-day game (e.g., 08:00 to 03:30 next day)
        isGameOpen =
          currentMinutes >= startMinutes || currentMinutes < endMinutes;

        if (resultMinutes > endMinutes) {
          // Result is same day as end time
          isGameClosed =
            currentMinutes >= endMinutes && currentMinutes < resultMinutes;
          isResultTime =
            currentMinutes >= resultMinutes && currentMinutes < startMinutes;
        } else {
          // Result is next day after end time
          isGameClosed =
            (currentMinutes >= endMinutes && currentMinutes < 1440) ||
            (currentMinutes >= 0 && currentMinutes < resultMinutes);
          isResultTime =
            currentMinutes >= resultMinutes && currentMinutes < startMinutes;
        }
      }

      if (isGameOpen) {
        gameStatus = "open";
      } else if (isGameClosed) {
        gameStatus = "closed";
      } else if (isResultTime) {
        gameStatus = "result_declared";
      } else {
        gameStatus = "waiting";
      }

      console.log(
        "⏰ Enhanced time-based status:",
        gameStatus,
        "Current:",
        currentTime,
        "Game times:",
        `${game.startTime}-${game.endTime} (Result: ${game.resultTime})`,
        "Minutes:",
        {
          current: currentMinutes,
          start: startMinutes,
          end: endMinutes,
          result: resultMinutes,
        },
      );
    } else {
      gameStatus = "waiting";
      console.log("⏸️ Game is inactive");
    }

    if (gameStatus !== "open") {
      console.log("❌ Game not open for betting. Status:", gameStatus);
      return res.status(400).json({
        success: false,
        message: `Betting is ${gameStatus === "waiting" ? "not started yet" : gameStatus === "closed" ? "closed" : "not available"} for this game`,
      });
    }

    console.log("✅ Game is open for betting. Status:", gameStatus);

    // Validate bet amount limits
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      console.log(
        "❌ Bet amount out of range:",
        betAmount,
        "Range:",
        game.minBet,
        "-",
        game.maxBet,
      );
      return res.status(400).json({
        success: false,
        message: `Bet amount must be between ₹${game.minBet} and ₹${game.maxBet}`,
      });
    }

    // Start atomic transaction
    await session.withTransaction(async () => {
      // Get user wallet with session lock
      let walletDoc = (await Wallet.findOne({ userId }).session(
        session,
      )) as HydratedDocument<IWallet>;

      if (!walletDoc) {
        const created = await Wallet.create([{ userId }], { session });
        walletDoc = created[0] as HydratedDocument<IWallet>;
      }

      const wallet = walletDoc;

      console.log(
        "💰 Current wallet balance:",
        wallet.depositBalance,
        "Required:",
        betAmount,
      );

      // Check sufficient balance
      if (wallet.depositBalance < betAmount) {
        throw new Error(
          `Insufficient wallet balance. Current: ���${wallet.depositBalance}, Required: ₹${betAmount}`,
        );
      }

      // Calculate potential winning
      let multiplier = 1;
      switch (betType) {
        case "jodi":
          multiplier = game.jodiPayout;
          break;
        case "haruf":
          multiplier = game.harufPayout;
          break;
        case "crossing":
          multiplier = game.crossingPayout;
          break;
        default:
          throw new Error("Invalid bet type");
      }

      const potentialWinning = betAmount * multiplier;

      // Create transaction record first
      const transaction = await Transaction.create(
        [
          {
            userId,
            type: "bet",
            amount: betAmount,
            status: "completed",
            description: `Bet placed on ${game.name} - ${betType.toUpperCase()} - ${betNumber}`,
            gameId: gameId,
            gameName: game.name,
            referenceId: `BET_${Date.now()}_${userId}`,
          },
        ],
        { session },
      );

      let placedBets = [];

      if (betType === "crossing") {
        const combos = getCrossingCombinations(betNumber, betData?.jodaCut);
        const perBetAmount = Math.floor(betAmount / combos.length);
        const perPotentialWin = perBetAmount * multiplier;

        const crossingBets = combos.map((combo) => ({
          userId,
          gameId,
          gameName: game.name,
          gameType: game.type,
          betType,
          betNumber: combo,
          betAmount: perBetAmount,
          potentialWinning: perPotentialWin,
           originalInput: betNumber,
          betData: {
            ...betData,
            originalInput: betNumber,
            jodaCut: betData?.jodaCut || false,
            userEmail,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          },
          gameDate: new Date(),
          gameTime: game.endTime,
          status: "pending",
          deductionTransactionId: transaction[0]._id,
        }));

        placedBets = await Bet.insertMany(crossingBets, { session });
      } else {
        placedBets = await Bet.create(
          [
            {
              userId,
              gameId,
              gameName: game.name,
              gameType: game.type,
              betType,
              betNumber,
              betAmount,
              potentialWinning,
              betData: {
                ...betData,
                userEmail,
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
              },
              gameDate: new Date(),
              gameTime: game.endTime,
              status: "pending",
              deductionTransactionId: transaction[0]._id,
            },
          ],
          { session },
        );
      }

      // Deduct amount from wallet atomically
      wallet.depositBalance -= betAmount;
      wallet.totalBets += betAmount;
      await wallet.save({ session });

      console.log("✅ Bet placed successfully!");
      // console.log("Bet ID:", bet[0]._id);
      console.log("Transaction ID:", transaction[0]._id);
      console.log("New wallet balance:", wallet.depositBalance);

      // Store data for response
      (req as any).betResult = {
        bet: placedBets[0], // ✅ for crossing too

        transaction: transaction[0],
        currentBalance: wallet.depositBalance,
        potentialWinning,
      };
    });

    // Send success response
    const result = (req as any).betResult;
    res.status(201).json({
      success: true,
      message: `Bet placed successfully on ${game.name}`,
      data: {
        betId: result.bet._id,
        gameId: game._id,
        gameName: game.name,
        betType: betType.toUpperCase(),
        betNumber,
        betAmount,
        potentialWinning: result.potentialWinning,
        currentBalance: result.currentBalance,
        transactionId: result.transaction._id,
        status: "pending",
      },
    });
  } catch (error: any) {
    console.error("❌ Place bet error:", error.message);

    // Send appropriate error response
    if (error.message.includes("Insufficient")) {
      res.status(400).json({
        success: false,
        message: error.message,
        type: "insufficient_balance",
      });
    } else if (error.message.includes("Invalid")) {
      res.status(400).json({
        success: false,
        message: error.message,
        type: "validation_error",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to place bet. Please try again.",
        type: "server_error",
      });
    }
  } finally {
    await session.endSession();
  }
};

// Get user's bets
export const getUserBets: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const gameType = req.query.gameType as string;
    const status = req.query.status as string;

    const query: any = { userId };

    if (gameType && gameType !== "all") {
      query.gameType = gameType;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const [bets, totalBets] = await Promise.all([
      Bet.find(query)
        .populate("gameId", "name type startTime endTime")
        .sort({ betPlacedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Bet.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBets / limit),
          totalBets,
          hasNext: page * limit < totalBets,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user bets error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get game results (public)
export const getGameResults: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const gameType = req.query.gameType as string;
    const gameId = req.query.gameId as string;

    const query: any = { status: "declared" };

    if (gameType && gameType !== "all") {
      query.gameType = gameType;
    }

    if (gameId) {
      query.gameId = gameId;
    }

    const [results, totalResults] = await Promise.all([
      GameResult.find(query)
        .populate("gameId", "name type")
        .sort({ resultDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      GameResult.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          hasNext: page * limit < totalResults,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get game results error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ROUTES

// Create new game (admin)
export const createGame: RequestHandler = async (req, res) => {
  try {
    const adminUser = (req as AdminRequest).admin;
    const gameData = {
      ...req.body,
      createdBy: adminUser?._id,
    };

    const game = new Game(gameData);
    await game.save();

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      data: game,
    });
  } catch (error: any) {
    console.error("Create game error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else if (error.code === 11000) {
      res.status(400).json({ message: "Game name already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Get all games for admin
export const getAdminGames: RequestHandler = async (req, res) => {
  try {
    const games = await Game.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      total: games.length,
      active: games.filter((g) => g.isActive).length,
      jodi: games.filter((g) => g.type === "jodi").length,
      haruf: games.filter((g) => g.type === "haruf").length,
      crossing: games.filter((g) => g.type === "crossing").length,
    };

    res.json({
      success: true,
      data: {
        games,
        stats,
      },
    });
  } catch (error) {
    console.error("Get admin games error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update game (admin)
export const updateGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate minBet limit (max ₹5000 as per requirement)
    if (req.body.minBet && req.body.minBet > 5000) {
      return res.status(400).json({
        success: false,
        message: "Minimum bet cannot exceed ₹5000",
      });
    }

    // Ensure minBet is not greater than maxBet
    if (
      req.body.minBet &&
      req.body.maxBet &&
      req.body.minBet > req.body.maxBet
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum bet cannot be greater than maximum bet",
      });
    }

    const game = await Game.findByIdAndUpdate(gameId, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "fullName email");

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    console.log(
      `✅ Game ${game.name} updated - isActive: ${game.isActive}, minBet: ₹${game.minBet}, maxBet: ₹${game.maxBet}`,
    );

    res.json({
      success: true,
      message: "Game updated successfully",
      data: game,
    });
  } catch (error: any) {
    console.error("Update game error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Force change game status (admin)
export const forceGameStatus: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { forceStatus } = req.body;

    if (
      !["waiting", "open", "closed", "result_declared"].includes(forceStatus)
    ) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const game = (await Game.findById(gameId)) as IGame;

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    // Store the forced status in a custom field
    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      {
        forcedStatus: forceStatus,
        lastStatusChange: new Date(),
      },
      { new: true },
    );

    console.log(`✅ Game ${game.name} status forced to: ${forceStatus}`);

    res.json({
      success: true,
      message: `Game status changed to ${forceStatus}`,
      data: updatedGame,
    });
  } catch (error: any) {
    console.error("Force game status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete game (admin)
export const deleteGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if game has pending bets
    const pendingBets = await Bet.countDocuments({
      gameId,
      status: "pending",
    });

    if (pendingBets > 0) {
      res.status(400).json({
        message: `Cannot delete game with ${pendingBets} pending bets`,
      });
      return;
    }

    const game = await Game.findByIdAndDelete(gameId);

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    res.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const declareResult: RequestHandler = async (req, res) => {
  console.log("=== 🧩 UNIFIED RESULT DECLARATION STARTED ===");

  try {
    const { gameId } = req.params;
    const { jodiResult, harufResult, crossingResult, resultDate } = req.body;
    const adminUser = (req as AdminRequest).admin;

    const fallbackResult = jodiResult || harufResult || crossingResult || "";

    if (!gameId) return res.status(400).json({ message: "Missing gameId" });

    const game = (await Game.findById(gameId)) as IGame;
    if (!game) return res.status(404).json({ message: "Game not found" });

    console.log(
      "🎯 Game:",
      game.name,
      "| Type:",
      game.type,
      "| DrawTime:",
      game.drawTime,
    );

    if (!game.drawTime || !/^\d{1,2}:\d{2}$/.test(game.drawTime)) {
      return res.status(400).json({ message: "Invalid or missing drawTime" });
    }

    const today = resultDate ? new Date(resultDate) : new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyDeclared = await GameResult.findOne({
      gameId,
      resultDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
      status: "declared",
    });

    if (alreadyDeclared) {
      return res.status(400).json({ message: "Result already declared" });
    }

    const declaredResults = {
      jodi: jodiResult || fallbackResult,
      haruf: harufResult || fallbackResult,
      crossing: crossingResult || fallbackResult,
      fallback: fallbackResult,
    };

    const bets = await Bet.find({ gameId, status: "pending" }).populate(
      "userId",
      "fullName mobile",
    );
    console.log(`📊 Total Bets Found: ${bets.length}`);

    let totalWinningAmount = 0;

    const betStats = {
      jodi: { totalBets: 0, totalAmount: 0, winningBets: 0, winningAmount: 0 },
      haruf: { totalBets: 0, totalAmount: 0, winningBets: 0, winningAmount: 0 },
      crossing: {
        totalBets: 0,
        totalAmount: 0,
        winningBets: 0,
        winningAmount: 0,
      },
    };

    for (const bet of bets) {
      const betType = bet.betType?.toLowerCase?.() || "unknown";
      const amount = bet.betAmount || 0;

      if (betStats[betType as "jodi" | "haruf" | "crossing"]) {
        betStats[betType].totalBets += 1;
        betStats[betType].totalAmount += amount;
      }

      const isWin = checkBetWinning(bet, declaredResults);
      const winningAmount = bet.potentialWinning || amount * 10;

      // ✅ Update winning bet
      if (isWin) {
        bet.status = "won";
        bet.isWinning = true;
        bet.winningAmount = winningAmount;
        totalWinningAmount += winningAmount;

        // Update stats
        if (betStats[betType as "jodi" | "haruf" | "crossing"]) {
          betStats[betType].winningBets += 1;
          betStats[betType].winningAmount += winningAmount;
        }

        // ✅ Update Wallet & Transaction
        const wallet = await Wallet.findOne({ userId: bet.userId._id });
        if (wallet) {
          // Credit winning amount to wallet correctly
          wallet.winningBalance += winningAmount;
          wallet.totalWinnings += winningAmount;
          // The pre-save hook will automatically update wallet.balance
          await wallet.save();

          console.log(`💰 WINNING CREDITED: ₹${winningAmount} to user ${bet.userId._id} - New winning balance: ₹${wallet.winningBalance}`);

          // Also update User model totalWinnings
          await User.findByIdAndUpdate(bet.userId._id, {
            $inc: { totalWinnings: winningAmount }
          });

          await Transaction.create({
            userId: bet.userId, // ye populated user object ho sakta hai, still works
            type: "win",
            amount: winningAmount,
            status: "completed",
            description: `Winnings for bet ${bet._id}`,
            relatedBetId: bet._id,
            gameId: gameId,
            gameName: game.name,
          });
        }
      } else {
        bet.status = "lost";
        bet.isWinning = false;
      }

      // ✅ Finalize bet update
      bet.resultDeclared = true;
      bet.resultDeclaredAt = new Date();
      bet.declaredResult = fallbackResult;

      await bet.save();
    }

    const totalBetAmount =
      betStats.jodi.totalAmount +
      betStats.haruf.totalAmount +
      betStats.crossing.totalAmount;
    const totalBets =
      betStats.jodi.totalBets +
      betStats.haruf.totalBets +
      betStats.crossing.totalBets;

    const netProfit = totalBetAmount - totalWinningAmount;
    const platformCommission = 0;

    const finalResult = await GameResult.create({
      gameId,
      gameName: game.name,
      gameType: game.type,
      drawTime: game.drawTime,
      resultDate: today,
      jodiResult,
      harufResult,
      crossingResult,
      declaredBy: adminUser._id,
      declaredAt: new Date(),
      status: "declared",
      isManual: true,
      totalBetAmount,
      totalWinningAmount,
      netProfit,
      totalBets,
      platformCommission,
      betDistribution: betStats,
    });

    console.log("✅ Result declared successfully");

    res.status(200).json({
      message: "Result declared successfully",
      result: finalResult,
    });
  } catch (err: any) {
    console.error("❌ Error declaring result:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const getGameAnalytics: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get game statistics
    const [game, results, totalBets] = await Promise.all([
      Game.findById(gameId),
      GameResult.find({
        gameId,
        resultDate: { $gte: startDate },
        status: "declared",
      }).sort({ resultDate: -1 }),
      Bet.find({
        gameId,
        betPlacedAt: { $gte: startDate },
      }),
    ]);

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    // Calculate analytics
    const analytics = {
      game: {
        name: game.name,
        type: game.type,
        totalResults: results.length,
      },
      financial: {
        totalBetAmount: results.reduce((sum, r) => sum + r.totalBetAmount, 0),
        totalWinningAmount: results.reduce(
          (sum, r) => sum + r.totalWinningAmount,
          0,
        ),
        totalCommission: results.reduce(
          (sum, r) => sum + r.platformCommission,
          0,
        ),
        totalProfit: results.reduce((sum, r) => sum + r.netProfit, 0),
      },
      betting: {
        totalBets: totalBets.length,
        averageBetAmount:
          totalBets.length > 0
            ? totalBets.reduce((sum, b) => sum + b.betAmount, 0) /
              totalBets.length
            : 0,
        uniqueUsers: new Set(totalBets.map((b) => b.userId.toString())).size,
      },
      results: results.map((r) => ({
        date: r.resultDate,
        jodiResult: r.jodiResult,
        harufResult: r.harufResult,
        crossingResult: r.crossingResult,
        totalBets: r.totalBets,
        totalAmount: r.totalBetAmount,
        profit: r.netProfit,
      })),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get game analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
