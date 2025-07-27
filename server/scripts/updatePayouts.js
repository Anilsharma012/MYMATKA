const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/matka-betting",
);

// Define Game schema (simplified)
const GameSchema = new mongoose.Schema(
  {
    name: String,
    jodiPayout: Number,
    harufPayout: Number,
    crossingPayout: Number,
  },
  { collection: "games" },
);

const Game = mongoose.model("Game", GameSchema);

async function updatePayouts() {
  try {
    console.log("🔄 Updating payout rates for all games...");

    // Update all games with new payout rates
    const result = await Game.updateMany(
      {}, // Update all games
      {
        $set: {
          jodiPayout: 95, // Jodi: 95:1
          harufPayout: 9, // Haruf: 9:1
          crossingPayout: 95, // Crossing: 95:1
        },
      },
    );

    console.log(
      `✅ Updated ${result.modifiedCount} games with new payout rates:`,
    );
    console.log("   📊 Jodi Payout: 95:1");
    console.log("   📊 Haruf Payout: 9:1");
    console.log("   📊 Crossing Payout: 95:1");

    // Verify the updates
    const updatedGames = await Game.find(
      {},
      "name jodiPayout harufPayout crossingPayout",
    );
    console.log("\n🎯 Verified payout rates:");
    updatedGames.forEach((game) => {
      console.log(
        `   ${game.name}: Jodi=${game.jodiPayout}, Haruf=${game.harufPayout}, Crossing=${game.crossingPayout}`,
      );
    });

    mongoose.connection.close();
    console.log("\n🎉 Payout rates updated successfully!");
  } catch (error) {
    console.error("❌ Error updating payouts:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

updatePayouts();
