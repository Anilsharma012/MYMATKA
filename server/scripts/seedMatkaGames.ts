import mongoose from "mongoose";
import Game from "../models/Game";
import User from "../models/User";
import connectDB from "../config/database";

/**
 * 🕘 Predefined Matka Games with Exact Timings
 * All games start at 8:00 AM daily
 * Each game has specific close and result times
 */

const matkaGames = [
  {
    name: "Delhi Bazar",
    type: "crossing" as const,
    description: "Classic Delhi Bazar game with high payouts",
    startTime: "08:00", // 8:00 AM
    endTime: "14:40", // 2:40 PM
    resultTime: "15:15", // 3:15 PM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Goa Market",
    type: "crossing" as const,
    description: "Goa Market game with exciting wins",
    startTime: "08:00", // 8:00 AM
    endTime: "16:10", // 4:10 PM
    resultTime: "16:30", // 4:30 PM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Shri Ganesh",
    type: "crossing" as const,
    description: "Shri Ganesh blessed game",
    startTime: "08:00", // 8:00 AM
    endTime: "16:15", // 4:15 PM
    resultTime: "16:50", // 4:50 PM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Faridabad",
    type: "crossing" as const,
    description: "Faridabad matka with high returns",
    startTime: "08:00", // 8:00 AM
    endTime: "17:45", // 5:45 PM
    resultTime: "18:30", // 6:30 PM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Ghaziabad",
    type: "crossing" as const,
    description: "Ghaziabad game with premium payouts",
    startTime: "08:00", // 8:00 AM
    endTime: "20:45", // 8:45 PM
    resultTime: "21:30", // 9:30 PM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Gali",
    type: "crossing" as const,
    description: "Gali game - night special",
    startTime: "08:00", // 8:00 AM
    endTime: "23:10", // 11:10 PM
    resultTime: "00:30", // 12:30 AM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
  {
    name: "Disawer",
    type: "crossing" as const,
    description: "Disawer - early morning special",
    startTime: "08:00", // 8:00 AM
    endTime: "03:30", // 3:30 AM (Night)
    resultTime: "06:00", // 6:00 AM (Next Day)
    minBet: 10,
    maxBet: 10000,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    commission: 5,
    isActive: true,
  },
];

async function seedMatkaGames() {
  try {
    await connectDB();
    console.log("🔗 Connected to MongoDB for seeding matka games...");

    // Find admin user to assign as creator
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error(
        "❌ No admin user found. Please create an admin user first.",
      );
      return;
    }

    console.log(`👨‍💼 Using admin: ${adminUser.fullName} (${adminUser.email})`);

    // Clear existing matka games
    await Game.deleteMany({
      name: { $in: matkaGames.map((g) => g.name) },
    });
    console.log("🗑️ Cleared existing matka games");

    // Create new games
    for (const gameData of matkaGames) {
      const game = new Game({
        ...gameData,
        createdBy: adminUser._id,
        currentStatus: "waiting",
        timezone: "Asia/Kolkata",
      });

      await game.save();
      console.log(`✅ Created game: ${game.name}`);
      console.log(
        `   📅 Start: ${game.startTime} | Close: ${game.endTime} | Result: ${game.resultTime}`,
      );
    }

    console.log("🎯 Successfully seeded all matka games!");
    console.log("\n📋 Game Schedule Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    matkaGames.forEach((game) => {
      console.log(
        `🎮 ${game.name.padEnd(15)} | Close: ${game.endTime} | Result: ${game.resultTime} (Next Day)`,
      );
    });

    console.log("━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🕐 All games start daily at 8:00 AM");
  } catch (error) {
    console.error("❌ Error seeding matka games:", error);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedMatkaGames();
