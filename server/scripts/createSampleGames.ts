import mongoose from "mongoose";
import Game from "../models/Game";
import User from "../models/User";
import connectDB from "../config/database";

const createSampleGames = async () => {
  try {
    await connectDB();

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error("No admin user found. Please create an admin first.");
      process.exit(1);
    }

    // Clear existing games
    await Game.deleteMany({});

    const sampleGames = [
      {
        name: "Delhi Bazar",
        type: "jodi",
        description: "Classic Delhi Bazar game with high payouts",
        startTime: "09:00",
        endTime: "11:30",
        resultTime: "12:00",
        minBet: 10,
        maxBet: 5000,
        jodiPayout: 90,
        harufPayout: 9,
        crossingPayout: 180,
        commission: 5,
        isActive: true,
        currentStatus: "open",
      },
      {
        name: "Mumbai Main",
        type: "jodi",
        description: "Main Mumbai market with traditional rules",
        startTime: "14:00",
        endTime: "16:30",
        resultTime: "17:00",
        minBet: 10,
        maxBet: 10000,
        jodiPayout: 95,
        harufPayout: 9,
        crossingPayout: 190,
        commission: 5,
        isActive: true,
        currentStatus: "open",
      },
      {
        name: "Kalyan",
        type: "jodi",
        description: "Popular Kalyan market with fast results",
        startTime: "15:00",
        endTime: "17:30",
        resultTime: "18:00",
        minBet: 10,
        maxBet: 3000,
        jodiPayout: 85,
        harufPayout: 8,
        crossingPayout: 170,
        commission: 5,
        isActive: true,
        currentStatus: "open",
      },
      {
        name: "Rajdhani Day",
        type: "haruf",
        description: "Day time Rajdhani with quick payouts",
        startTime: "12:00",
        endTime: "14:30",
        resultTime: "15:00",
        minBet: 10,
        maxBet: 2000,
        jodiPayout: 90,
        harufPayout: 9,
        crossingPayout: 180,
        commission: 5,
        isActive: true,
        currentStatus: "open",
      },
      {
        name: "Time Bazar",
        type: "crossing",
        description: "Time based market with premium rates",
        startTime: "10:00",
        endTime: "12:30",
        resultTime: "13:00",
        minBet: 10,
        maxBet: 1000,
        jodiPayout: 80,
        harufPayout: 8,
        crossingPayout: 160,
        commission: 5,
        isActive: true,
        currentStatus: "open",
      },
    ];

    for (const gameData of sampleGames) {
      const game = new Game({
        ...gameData,
        createdBy: adminUser._id,
      });
      await game.save();
      console.log(`Created game: ${game.name}`);
    }

    console.log("Sample games created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating sample games:", error);
    process.exit(1);
  }
};

createSampleGames();
