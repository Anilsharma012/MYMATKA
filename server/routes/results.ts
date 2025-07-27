import express from "express";
import mongoose from "mongoose";
import Game from "../models/Game";
import Bet from "../models/Bet";
import User from "../models/User";
import Wallet from "../models/Wallet";
import auth from "../middleware/auth";
import { adminAuth, AdminRequest } from "../middleware/adminAuth";

const router = express.Router();





const disableTestLimits = (req: any, res: any, next: any) => {
  // Skip test limit checks in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Original test limit logic would go here
  next();
};

router.post("/declare/:gameId", adminAuth, disableTestLimits, async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      declaredResult,
      jodiResult,
      harufResult,
      crossingResult
    } = req.body;

    const adminId = (req as AdminRequest).admin?._id;

    // Determine which result to use based on what's provided
    const resultToUse = jodiResult || harufResult || crossingResult || declaredResult;

    // Validate input
    if (!resultToUse) {
      return res.status(400).json({
        success: false,
        message: "No valid result provided. Please provide a result for the game type.",
      });
    }

    // Validate game exists and is in correct status
    const now = new Date();
    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    const gameName = game.name || "N/A";

    if (game.declaredResult) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this game",
      });
    }

    if (game.currentStatus !== "closed") {
      return res.status(400).json({
        success: false,
        message: "Can only declare result for closed games",
      });
    }

    // Determine which result to use based on game type
    let resultValue = '';
    if (game.type === 'jodi') {
      resultValue = jodiResult || resultToUse;
    } else if (game.type === 'haruf') {
      resultValue = harufResult || resultToUse;
    } else if (game.type === 'crossing') {
      resultValue = crossingResult || resultToUse;
    } else {
      resultValue = resultToUse; // fallback
    }

    if (!resultValue) {
      return res.status(400).json({
        success: false,
        message: `No valid ${game.type} result provided`,
      });
    }

    // Update game with declared result
    const resultStr = resultValue.trim();

    const updateData: any = {
      declaredResult: resultStr,
      resultDeclaredAt: now,
      resultDeclaredBy: adminId,
      resultMethod: "manual",
      currentStatus: "result_declared",
      isResultPending: false,
      lastResultDate: now,
      lastStatusChange: now,
      result: {
        jodi: game.type === "jodi" ? resultStr : "",
        haruf: game.type === "haruf" ? resultStr : "",
        crossing: game.type === "crossing" ? resultStr : "",
      },
    };
    



    await Game.findByIdAndUpdate(gameId, updateData);

    // Process all bets for this game and determine winners/losers
    const processedBets = await processBetsForResult(gameId, {
      jodi: jodiResult || '',  
      haruf: harufResult || '',
      crossing: crossingResult || '',
    fallback: (resultToUse || '').trim()

    });
    


    console.log(`🎯 Result declared for game ${gameName} (${game.type}): ${resultValue}`);
    console.log(`📊 Processed ${processedBets.totalBets} bets: ${processedBets.winningBets} wins, ${processedBets.losingBets} losses`);

    // Prepare response with all relevant result data
    const responseData: any = {
      gameId,
      gameName: gameName,
      gameType: game.type,
      declaredResult: resultValue.trim(),
      resultDeclaredAt: now,
      method: "manual",
      processedBets,
    };

    // Include specific result field in response
    if (game.type === 'jodi') {
      responseData.jodiResult = resultValue.trim();
    } else if (game.type === 'haruf') {
      responseData.harufResult = resultValue.trim();
    } else if (game.type === 'crossing') {
      responseData.crossingResult = resultValue.trim();
    }

    res.json({
      success: true,
      message: `Result declared successfully for ${game.type} game`,
      data: responseData,
    });
  } catch (error: any) {
    console.error("❌ Error declaring result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to declare result",
      error: error.message,
    });
  }
});


router.get("/pending", adminAuth, async (req, res) => {
  try {
    const now = new Date();

    // Find games that are closed but don't have results declared yet
    const pendingGames = await Game.find({
      currentStatus: "closed",
      declaredResult: { $exists: false },
      isActive: true,
    })
      .populate("createdBy", "name email")
      .sort({ endTime: 1 });

    // Add auto-schedule information
    const gamesWithSchedule = pendingGames.map((game) => {
      const gameObj = game.toObject();

      // Calculate when auto result should be declared (24 hours after end time)
      const today = new Date();
      const [hours, minutes] = game.endTime.split(":").map(Number);
      const endDateTime = new Date(today);
      endDateTime.setHours(hours, minutes, 0, 0);

      // If end time has passed today, it ended today
      // Auto result should be declared 24 hours later
      const autoScheduleTime = new Date(
        endDateTime.getTime() + 24 * 60 * 60 * 1000,
      );

      return {
        ...gameObj,
        autoResultScheduled: autoScheduleTime,
        hoursUntilAutoResult: Math.max(
          0,
          Math.ceil(
            (autoScheduleTime.getTime() - now.getTime()) / (1000 * 60 * 60),
          ),
        ),
        isOverdue: now > autoScheduleTime,
      };
    });

    res.json({
      success: true,
      data: {
        pendingGames: gamesWithSchedule,
        totalPending: gamesWithSchedule.length,
        overdueCount: gamesWithSchedule.filter((g) => g.isOverdue).length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching pending results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending results",
      error: error.message,
    });
  }
});


router.get("/history", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Parse query parameters
    const filters = {
      gameType: req.query.gameType as string,
      dateRange: req.query.dateRange as string,
      status: req.query.status as string,
    };

    // Build query based on filters
    const query: any = {
      declaredResult: { $exists: true },
      resultDeclaredAt: { $exists: true },
    };

    // Apply game type filter
    if (filters.gameType) {
      query.type = filters.gameType;
    }

    // Apply date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange.split(",");
      query.resultDeclaredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Apply status filter
    if (filters.status) {
      query.currentStatus = filters.status;
    }

    // Fetch results with aggregation for better performance
    const pipeline = [
      { $match: query },
      { $sort: { resultDeclaredAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $addFields: {
          adminName: { $arrayElemAt: ["$admin.name", 0] },
          resultDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$resultDeclaredAt" },
          },
        },
      },
      { $unset: ["admin"] },
    ];

    const games = await Game.aggregate(pipeline as any);



    const totalGames = await Game.countDocuments(query);

    // Calculate statistics
    const statsArray = await Game.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWinningAmount: { $sum: "$totalWinAmount" },
          avgWinningAmount: { $avg: "$totalWinAmount" },
        },
      },
    ]).exec();

    const stats = statsArray[0] || {};


    res.json({
      success: true,
      games,
      totalPages: Math.ceil(totalGames / limit),
      currentPage: page,
      totalGames,
      statistics: stats,
      filters: {
        availableGameTypes: ["jodi", "haruf", "crossing"],
        availableStatuses: ["waiting", "open", "closed", "result_declared"],
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching results history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results history",
      error: error.message,
    });
  }
});


router.get("/game/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId)
      .populate("resultDeclaredBy", "name")
      .select("name declaredResult resultDeclaredAt resultMethod currentStatus")
      .lean();

    const gameName = (game as any)?.name || "N/A";

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (!game.declaredResult) {
      return res.json({
        success: true,
        data: {
          gameId,
          gameName: game.name,

          status: game.currentStatus,
          resultDeclared: false,
          message: "Result not yet declared",
        },
      });
    }

    res.json({
      success: true,
      data: {
        gameId,
        gameName: game.name,

        declaredResult: game.declaredResult,
        resultDeclaredAt: game.resultDeclaredAt,
        resultMethod: game.resultMethod,
        resultDeclaredBy: (game.resultDeclaredBy as any)?.name || "System",
        status: game.currentStatus,
        resultDeclared: true,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching game result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game result",
      error: error.message,
    });
  }
});


router.get("/user-bets/:gameId", auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).user._id;

    const game = await Game.findById(gameId)
      .select("name declaredResult resultDeclaredAt")
      .lean();

    const gameName = (game as any)?.name || "N/A";

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Get user's bets for this game
    const userBets = await Bet.find({
      gameId,
      userId,
    }).sort({ createdAt: -1 });

    // Calculate win/loss status if result is declared
    const betsWithResults = userBets.map((bet) => {
      const betObj = bet.toObject();

      if (game.declaredResult) {
        const isWinning = checkBetWinning(bet, game.declaredResult as any);
        return {
          ...betObj,
          isWinning,
          declaredResult: game.declaredResult,
          resultDeclaredAt: game.resultDeclaredAt,
        };
      }

      return {
        ...betObj,
        isWinning: null,
        declaredResult: null,
        resultDeclaredAt: null,
      };
    });

    const winningBets = betsWithResults.filter((bet) => bet.isWinning === true);
    const losingBets = betsWithResults.filter((bet) => bet.isWinning === false);
    const totalWinAmount = winningBets.reduce(
      (sum, bet) => sum + (bet.potentialWinning || 0),
      0,
    );

    res.json({
      success: true,
      data: {
        gameName: gameName,
        declaredResult: game.declaredResult,
        resultDeclaredAt: game.resultDeclaredAt,
        userBets: betsWithResults,
        summary: {
          totalBets: userBets.length,
          winningBets: winningBets.length,
          losingBets: losingBets.length,
          totalWinAmount,
          resultDeclared: !!game.declaredResult,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching user bet results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user bet results",
      error: error.message,
    });
  }
});




async function processBetsForResult(
  gameId: string,
  declaredResultObj: {
    jodi: string;
    haruf: string;
    crossing: string;
    fallback: string;
  }
) {
  try {
    const bets = await Bet.find({ gameId }).populate("userId", "name email");

    let winningBets = 0;
    let losingBets = 0;
    let totalWinAmount = 0;

    for (const bet of bets) {
      const isWinning = checkBetWinning(bet, declaredResultObj);

      // Update bet with result
      await Bet.findByIdAndUpdate(bet._id, {
        isWinning,
        resultDeclared: true,
        resultDeclaredAt: new Date(),
        declaredResult: declaredResultObj.fallback,
      });

      if (isWinning) {
        const winAmount = bet.potentialWinning || 0;
        winningBets++;
        totalWinAmount += winAmount;

        // ✅ Update User model
        await User.findByIdAndUpdate(bet.userId, {
          $inc: {
            totalWinnings: winAmount,
          },
        });

        // ✅ Update Wallet model - credit winning balance and total balance
        let wallet = await Wallet.findOne({ userId: bet.userId });
        if (!wallet) {
          wallet = await Wallet.create({
            userId: bet.userId,
            balance: 0,
            winningBalance: 0,
            depositBalance: 0,
            bonusBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalWinnings: 0
          });
        }

        // Credit winning amount to wallet
        wallet.winningBalance += winAmount;
        wallet.balance += winAmount; // Also add to main balance for withdrawal
        wallet.totalWinnings += winAmount;
        await wallet.save();

        console.log(`💰 Credited ₹${winAmount} to user ${bet.userId} - New winning balance: ₹${wallet.winningBalance}`);

      } else {
        losingBets++;
      }
    }

    console.log(
      `📊 Processed ${bets.length} bets for game ${gameId}: ${winningBets} wins, ${losingBets} losses, ₹${totalWinAmount} total winnings`
    );

    return {
      totalBets: bets.length,
      winningBets,
      losingBets,
      totalWinAmount,
    };
  } catch (error) {
    console.error("❌ Error processing bets:", error);
    throw error;
  }
}






function checkBetWinning(
  bet: any,
  declaredResults: {
    jodi: string;
    haruf: string;
    crossing: string;
    fallback: string;
  }
): boolean {
  console.log('\n🔍 Checking bet win status:', {
    betId: bet._id,
    betType: bet.betType,
    betNumber: bet.betNumber,
    betData: bet.betData,
    declaredResults
  });
  const betNumber = bet.betNumber?.toString() || '';
  const betType = bet.betType?.toLowerCase();
  const betData = bet.betData || {};

  if (!declaredResults || !betType) {
    console.warn('Missing required data for bet check:', { declaredResults, betType, betId: bet._id });
    return false;
  }

  // Jodi bet - exact match with declared result
  if (betType === 'jodi') {
    const isWin = betNumber === declaredResults.jodi;
    console.log(`🎯 Jodi check: ${betNumber} === ${declaredResults.jodi} -> ${isWin ? 'WIN' : 'LOSE'}`);
    return isWin;
  }


  // Haruf bet - match first or last digit based on position
  if (betType === 'haruf') {
    // Always use jodi result for haruf bets as it's the source of truth for A1/B2
    const result = declaredResults.jodi || '';
    console.log('🔢 Haruf check - Using Jodi result digits:', result);
    
    if (!result || result.length < 2) {
      console.warn("⚠️ Jodi result missing or too short for haruf check");
      return false;
    }
    
    const firstDigit = result[0];
    const lastDigit = result[1];
    
    // Get the digit and position from bet data
    let harufDigit = betData.harufDigit || '';
    let harufPosition = betData.harufPosition || '';
    
    // Fallback for legacy data - extract from betNumber (e.g., 'A1' or 'B4')
    if (!harufDigit || !harufPosition) {
      const match = betNumber.match(/^([AB])(\d)$/i);
      if (match) {
        harufPosition = match[1].toUpperCase(); // Keep as 'A' or 'B'
        harufDigit = match[2];
        console.log(`   Extracted from betNumber: Position=${harufPosition}, Digit=${harufDigit}`);
      } else {
        // If no position specified, assume it's just the digit for first position
        harufDigit = betNumber;
        harufPosition = 'A';
        console.log(`   Using betNumber as digit: ${harufDigit}, Defaulting to position A`);
      }
    }
    
    // Check for win condition
    if (harufDigit) {
      console.log(`   Checking haruf: Digit=${harufDigit}, Position=${harufPosition}`);
      
      // If position is A or FIRST, check first digit
      if (harufPosition === 'A' || harufPosition === 'FIRST' || harufPosition === 'ANDHAR' || harufPosition === 'A1') {
        const isWin = firstDigit === harufDigit;
        console.log(`   Checking first digit: ${firstDigit} === ${harufDigit} -> ${isWin ? 'WIN' : 'LOSE'}`);
        return isWin;
      } 
      // If position is B or LAST, check second digit
      else if (harufPosition === 'B' || harufPosition === 'LAST' || harufPosition === 'BAHAR' || harufPosition === 'B2') {
        const isWin = lastDigit === harufDigit;
        console.log(`   Checking last digit: ${lastDigit} === ${harufDigit} -> ${isWin ? 'WIN' : 'LOSE'}`);
        return isWin;
      }
    }
    
    return false;
  }
  

  // Crossing bet - any combination of two different digits from the result
  if (betType === 'crossing') {
    // Use crossing result if available, otherwise fallback to jodi result
    const result = declaredResults.crossing || declaredResults.jodi || '';
    console.log('🔄 Crossing check - Result digits:', result);
    
    if (!result || result.length < 2) {
      console.warn("⚠️ Crossing result missing or too short");
      return false;
    }
    
    const digits = result.split('');
    const outcomes = new Set();
    
    // Generate all possible ordered 2-digit combinations from the result
    for (let i = 0; i < digits.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        if (i !== j) { // Ensure different positions
          outcomes.add(digits[i] + digits[j]);
        }
      }
    }
    
    // Also check reverse of the bet number since order matters in crossing
    const reversedBetNumber = betNumber.split('').reverse().join('');
    const isWin = outcomes.has(betNumber) || outcomes.has(reversedBetNumber);
    
    console.log(`   Crossing check: Bet=${betNumber}, Reversed=${reversedBetNumber}, Possible outcomes:`, Array.from(outcomes));
    console.log(`   Result: ${isWin ? 'WIN' : 'LOSE'}`);
    
    return isWin;
  }

  console.warn(`Unknown bet type: ${betType}`);

  return false;
}



function testHarufLogic() {
  console.log('\n🔍 Testing Haruf Bet Logic\n' + '='.repeat(30));

  const testCases = [
    ['A1', 'andhar', '14', true],
    ['B4', 'bahar', '14', true],
    ['A5', 'andhar', '14', false],
    ['B2', 'bahar', '14', false],
    ['A1', 'bahar', '14', false],
    ['B4', 'andhar', '14', false],
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(([betNumber, position, declaredResult, shouldWin], index) => {
    const bet = {
      number: betNumber,
      position,
      betType: 'haruf'
    };

    const result = checkBetWinning(bet as any, declaredResult as any);
    const status = result === shouldWin ? '✅ PASS' : '❌ FAIL';

    if (result === shouldWin) passed++;
    else failed++;

    console.log(`Test ${index + 1}: ${status}`);
    console.log(`  Bet: ${betNumber} (${position})`);
    console.log(`  Result: ${declaredResult}`);
    console.log(`  Expected: ${shouldWin ? 'Win' : 'Lose'}, Got: ${result ? 'Win' : 'Lose'}\n`);
  });



  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'='.repeat(30)}\n`);
}



export default router;
