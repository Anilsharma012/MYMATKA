import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database";
import Game from "../models/Game";
import Bet from "../models/Bet";
import User from "../models/User";
import Wallet from "../models/Wallet";

dotenv.config();

async function testUnifiedResultDeclaration() {
  try {
    await connectDB();
    console.log("🚀 Testing Unified Result Declaration Logic...");

    // Find a test game
    const game = await Game.findOne({ name: /delhi/i });
    if (!game) {
      console.log("❌ No test game found");
      return;
    }

    console.log(`🎮 Using game: ${game.name}`);

    // Create test user if not exists
    let testUser = await User.findOne({ mobile: "9999999999" });
    if (!testUser) {
      testUser = await User.create({
        fullName: "Test User",
        email: "test@example.com",
        mobile: "9999999999",
        password: "password123",
        referralCode: "TEST1234",
      });
      console.log("👤 Created test user");
    }

    // Create test wallet if not exists
    let testWallet = await Wallet.findOne({ userId: testUser._id });
    if (!testWallet) {
      testWallet = await Wallet.create({
        userId: testUser._id,
        depositBalance: 1000,
        winningBalance: 0,
        totalDeposits: 1000,
        totalWithdrawals: 0,
        totalWinnings: 0,
      });
      console.log("💰 Created test wallet");
    }

    // Clean up old test bets
    await Bet.deleteMany({
      userId: testUser._id,
      gameId: game._id,
      betAmount: 100, // Our test bet amount
    });

    // Create test bets for unified result testing
    const testBets = [
      {
        userId: testUser._id,
        gameId: game._id,
        gameName: game.name,
        gameTime: game.resultTime,
        gameType: game.type,
        betType: "jodi",
        betNumber: "25", // This should win if winning number is 25
        betAmount: 100,
        potentialWinning: 9500, // 100 * 95
        gameDate: new Date(),
        betPlacedAt: new Date(),
        status: "pending",
      },
      {
        userId: testUser._id,
        gameId: game._id,
        gameName: game.name,
        gameTime: game.resultTime,
        gameType: game.type,
        betType: "haruf",
        betNumber: "2", // This should win if winning number is 25 (first digit)
        betAmount: 100,
        potentialWinning: 900, // 100 * 9
        gameDate: new Date(),
        betPlacedAt: new Date(),
        status: "pending",
        betData: { harufPosition: "first" },
      },
      {
        userId: testUser._id,
        gameId: game._id,
        gameName: game.name,
        gameTime: game.resultTime,
        gameType: game.type,
        betType: "haruf",
        betNumber: "5", // This should win if winning number is 25 (last digit)
        betAmount: 100,
        potentialWinning: 900, // 100 * 9
        gameDate: new Date(),
        betPlacedAt: new Date(),
        status: "pending",
        betData: { harufPosition: "last" },
      },
      {
        userId: testUser._id,
        gameId: game._id,
        gameName: game.name,
        gameTime: game.resultTime,
        gameType: game.type,
        betType: "crossing",
        betNumber: "25", // This should win if winning number is 25
        betAmount: 100,
        potentialWinning: 9500, // 100 * 95
        gameDate: new Date(),
        betPlacedAt: new Date(),
        status: "pending",
      },
      {
        userId: testUser._id,
        gameId: game._id,
        gameName: game.name,
        gameTime: game.resultTime,
        gameType: game.type,
        betType: "crossing",
        betNumber: "52", // This should win if winning number is 25 (crossing logic)
        betAmount: 100,
        potentialWinning: 9500, // 100 * 95
        gameDate: new Date(),
        betPlacedAt: new Date(),
        status: "pending",
      },
    ];

    // Create the test bets
    const createdBets = await Bet.create(testBets);
    console.log(`📊 Created ${createdBets.length} test bets`);

    // Test the unified result declaration
    console.log(
      "🎯 Testing unified result declaration with winning number: 25",
    );

    // Simulate the unified winning logic
    const winningNumber = "25";
    let winners = 0;

    for (const bet of createdBets) {
      let isWinner = false;

      switch (bet.betType) {
        case "jodi":
          isWinner = bet.betNumber === winningNumber;
          break;
        case "haruf":
          if (bet.betData?.harufPosition === "first") {
            isWinner = bet.betNumber === winningNumber.charAt(0);
          } else if (bet.betData?.harufPosition === "last") {
            isWinner = bet.betNumber === winningNumber.charAt(1);
          } else {
            isWinner = winningNumber.includes(bet.betNumber);
          }
          break;
        case "crossing":
          isWinner = bet.betNumber === winningNumber;
          if (!isWinner) {
            const winDigits = winningNumber.split("");
            const betDigits = bet.betNumber.split("");
            if (winDigits.length >= 2 && betDigits.length === 2) {
              isWinner = betDigits.every((digit) => winDigits.includes(digit));
            }
          }
          break;
      }

      console.log(
        `   ${bet.betType.toUpperCase()} bet ${bet.betNumber}: ${isWinner ? "✅ WIN" : "❌ LOSE"}`,
      );
      if (isWinner) winners++;
    }

    console.log(
      `🏆 Total winners: ${winners} out of ${createdBets.length} bets`,
    );
    console.log("✅ Unified result declaration logic test completed!");

    // Clean up test bets
    await Bet.deleteMany({ _id: { $in: createdBets.map((b) => b._id) } });
    console.log("🧹 Cleaned up test bets");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testUnifiedResultDeclaration();
