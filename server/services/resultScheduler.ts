import cron from "node-cron";
import Game from "../models/Game";
import Bet from "../models/Bet";
import User from "../models/User";
import Wallet from "../models/Wallet";


/**
 * 🧩 Automatic Result Declaration System
 *
 * Runs every hour to check if any games need automatic result declaration
 * Results are declared exactly 24 hours after game end time
 */

interface ProcessedBets {
  totalBets: number;
  winningBets: number;
  losingBets: number;
  totalWinAmount: number;
}

class ResultScheduler {
  private static instance: ResultScheduler;

  private constructor() {
    this.startScheduler();
  }

  public static getInstance(): ResultScheduler {
    if (!ResultScheduler.instance) {
      ResultScheduler.instance = new ResultScheduler();
    }
    return ResultScheduler.instance;
  }

  /**
   * Start the cron job scheduler
   */
  private startScheduler(): void {
    // Run every hour at minute 0 (e.g., 12:00, 1:00, 2:00, etc.)
    cron.schedule("0 * * * *", () => {
      this.checkAndDeclareResults();
    });

    // Also run at startup to catch any missed results
    setTimeout(() => {
      this.checkAndDeclareResults();
    }, 5000);

    console.log("🕐 Automatic result declaration scheduler started");
  }

  /**
   * Check for games that need automatic result declaration
   */
  private async checkAndDeclareResults(): Promise<void> {
    try {
      const now = new Date();
      console.log(
        `🔍 Checking for games needing result declaration at ${now.toISOString()}`,
      );

      // Find games that are closed but don't have results declared
      const pendingGames = await Game.find({
        currentStatus: "closed",
        declaredResult: { $exists: false },
        isActive: true,
      });

      for (const game of pendingGames) {
        const shouldDeclareResult = this.shouldDeclareResultNow(game, now);

        if (shouldDeclareResult) {
          await this.declareAutomaticResult(game);
        }
      }
    } catch (error) {
      console.error("❌ Error in automatic result declaration:", error);
    }
  }

  /**
   * Check if result should be declared now (24 hours after end time)
   */
  private shouldDeclareResultNow(game: any, now: Date): boolean {
    try {
      // Get today's date and set the end time
      const today = new Date();
      const [hours, minutes] = game.endTime.split(":").map(Number);

      // Create end time for today
      const endTimeToday = new Date(today);
      endTimeToday.setHours(hours, minutes, 0, 0);

      // If current time is before end time today, the game hasn't ended yet
      if (now < endTimeToday) {
        return false;
      }

      // Calculate 24 hours after end time
      const autoResultTime = new Date(
        endTimeToday.getTime() + 24 * 60 * 60 * 1000,
      );

      // Check if we've passed the auto result time
      const shouldDeclare = now >= autoResultTime;

      if (shouldDeclare) {
        console.log(`⏰ Game ${game.name} ready for auto result declaration`);
        console.log(`   End time: ${endTimeToday.toISOString()}`);
        console.log(`   Auto result time: ${autoResultTime.toISOString()}`);
        console.log(`   Current time: ${now.toISOString()}`);
      }

      return shouldDeclare;
    } catch (error) {
      console.error(
        `❌ Error checking result timing for game ${game._id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Declare automatic result for a game
   */
  private async declareAutomaticResult(game: any): Promise<void> {
    try {
      console.log(`🎯 Declaring automatic result for game: ${game.name}`);

      // Generate random result (0-9)
      const declaredResult = Math.floor(Math.random() * 10).toString();
      const now = new Date();

      // Update game with declared result
      await Game.findByIdAndUpdate(game._id, {
        declaredResult,
        resultDeclaredAt: now,
        resultMethod: "automatic",
        currentStatus: "result_declared",
        isResultPending: false,
        lastResultDate: now,
        lastStatusChange: now,
      });

      // Process all bets for this game
      const processedBets = await this.processBetsForResult(
        game._id,
        declaredResult,
      );

      console.log(`✅ Automatic result declared for ${game.name}:`);
      console.log(`   Result: ${declaredResult}`);
      console.log(`   Processed ${processedBets.totalBets} bets`);
      console.log(`   Winners: ${processedBets.winningBets}`);
      console.log(`   Losers: ${processedBets.losingBets}`);
      console.log(`   Total winnings: ₹${processedBets.totalWinAmount}`);

      // Log for admin tracking
      console.log(
        `📊 AUTO RESULT DECLARED: ${game.name} = ${declaredResult} at ${now.toISOString()}`,
      );
    } catch (error) {
      console.error(
        `❌ Error declaring automatic result for game ${game._id}:`,
        error,
      );
    }
  }

  /**
   * Process all bets for a game when result is declared
   */
  private async processBetsForResult(
    gameId: string,
    declaredResult: string,
  ): Promise<ProcessedBets> {
    try {
      const bets = await Bet.find({ gameId }).populate("userId", "name email");

      let winningBets = 0;
      let losingBets = 0;
      let totalWinAmount = 0;

      for (const bet of bets) {
        const isWinning = this.checkBetWinning(bet, declaredResult);

        // Update bet with result
        await Bet.findByIdAndUpdate(bet._id, {
          isWinning,
          resultDeclared: true,
          resultDeclaredAt: new Date(),
          declaredResult,
        });

        if (isWinning) {
          winningBets++;
          totalWinAmount += bet.potentialWinning || 0;

          // Add winning amount to user's wallet
          // Credit winning to both User and Wallet models for sync
          await Promise.all([
            User.findByIdAndUpdate(bet.userId, {
              $inc: {
                winningBalance: bet.potentialWinning || 0,
                totalWinnings: bet.potentialWinning || 0,
              },
            }),
            Wallet.findOneAndUpdate(
              { userId: bet.userId },
              {
                $inc: {
                  winningBalance: bet.potentialWinning || 0,
                  totalWinnings: bet.potentialWinning || 0,
                },
              },
              { upsert: true, new: true }
            )
          ]);

const user = bet.userId as any;

         console.log(
  `💰 Winner: ${user.name || "User"} won ₹${bet.potentialWinning} on ${bet.betType} ${bet.betNumber}`,
);
        } else {
          losingBets++;
        }
      }

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

  /**
   * Check if a bet is winning based on declared result
   */
  private checkBetWinning(bet: any, declaredResult: string): boolean {
    switch (bet.betType) {
      case "jodi":
        // For Jodi: exact match with bet number
        return bet.betNumber === declaredResult;

      case "haruf":
        // For Haruf: check if declared result contains the bet digit in correct position
        if (bet.harufPosition === "first" || bet.harufPosition === "start") {
          return declaredResult.charAt(0) === bet.betNumber;
        } else if (
          bet.harufPosition === "last" ||
          bet.harufPosition === "end"
        ) {
          return (
            declaredResult.charAt(declaredResult.length - 1) === bet.betNumber
          );
        }
        // Default: check if digit appears anywhere
        return declaredResult.includes(bet.betNumber);

      case "crossing":
        // For Crossing: check if any of the crossing combinations match
        if (
          bet.crossingCombinations &&
          Array.isArray(bet.crossingCombinations)
        ) {
          return bet.crossingCombinations.some(
            (combo: any) => combo.number === declaredResult,
          );
        }
        // Fallback: direct match
        return bet.betNumber === declaredResult;

      default:
        return false;
    }
  }

  /**
   * Manually trigger result check (for testing)
   */
  public async triggerResultCheck(): Promise<void> {
    console.log("🔄 Manually triggering result declaration check...");
    await this.checkAndDeclareResults();
  }

  /**
   * Get status of pending results
   */
  public async getPendingResultsStatus(): Promise<any> {
    try {
      const now = new Date();
      const pendingGames = await Game.find({
        currentStatus: "closed",
        declaredResult: { $exists: false },
        isActive: true,
      }).select("name endTime");

      const status = pendingGames.map((game) => {
        const [hours, minutes] = game.endTime.split(":").map(Number);
        const endTime = new Date();
        endTime.setHours(hours, minutes, 0, 0);

        const autoResultTime = new Date(
          endTime.getTime() + 24 * 60 * 60 * 1000,
        );
        const hoursRemaining = Math.max(
          0,
          Math.ceil(
            (autoResultTime.getTime() - now.getTime()) / (1000 * 60 * 60),
          ),
        );

        return {
          gameId: game._id,
          gameName: game.name,
          endTime: game.endTime,
          autoResultTime: autoResultTime.toISOString(),
          hoursRemaining,
          isOverdue: now > autoResultTime,
        };
      });

      return {
        totalPending: status.length,
        overdueCount: status.filter((s) => s.isOverdue).length,
        games: status,
        lastChecked: now.toISOString(),
      };
    } catch (error) {
      console.error("❌ Error getting pending results status:", error);
      throw error;
    }
  }
}

export default ResultScheduler;
