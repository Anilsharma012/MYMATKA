import mongoose from "mongoose";
import Game from "../models/Game";
import { config } from "dotenv";

config();

async function setAllGamesOpen() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");

    // Update all games to have forced status "open"
    const result = await Game.updateMany(
      { isActive: true },
      {
        forcedStatus: "open",
        lastStatusChange: new Date(),
      },
    );

    console.log(`✅ Updated ${result.modifiedCount} games to "open" status`);

    // List all games with their status
    const games = await Game.find({ isActive: true });
    console.log("\n📋 Games Status:");
    games.forEach((game) => {
      console.log(
        `${game.name}: ${game.forcedStatus || "time-based"} (${game.isActive ? "active" : "inactive"})`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

setAllGamesOpen();
