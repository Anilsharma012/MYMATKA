const mongoose = require("mongoose");
require("dotenv").config();

const checkWinnings = async () => {
  try {
    console.log("🔄 Checking database for winnings...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/matka_game"
    );

    console.log("✅ Connected to database");

    // Check users with totalWinnings > 0
    const usersWithWinnings = await mongoose.connection.db
      .collection("users")
      .find({ totalWinnings: { $gt: 0 } })
      .toArray();

    console.log(`📊 Found ${usersWithWinnings.length} users with totalWinnings > 0:`);
    
    for (const user of usersWithWinnings) {
      console.log(`💰 ${user.fullName} (${user.mobile}): ₹${user.totalWinnings}`);
    }

    // Check wallets
    const walletsWithWinnings = await mongoose.connection.db
      .collection("wallets")
      .find({ winningBalance: { $gt: 0 } })
      .toArray();

    console.log(`\n💼 Found ${walletsWithWinnings.length} wallets with winningBalance > 0:`);
    
    for (const wallet of walletsWithWinnings) {
      const user = await mongoose.connection.db
        .collection("users")
        .findOne({ _id: wallet.userId });
      console.log(`💰 ${user?.fullName || "Unknown"}: ₹${wallet.winningBalance}`);
    }

    // Check for payalsaini specifically
    const payalUser = await mongoose.connection.db
      .collection("users")
      .findOne({ fullName: /payal/i });

    if (payalUser) {
      console.log(`\n🔍 Found user matching "payal": ${payalUser.fullName} (${payalUser.mobile})`);
      console.log(`   Total Winnings: ₹${payalUser.totalWinnings || 0}`);
      
      // Check their wallet
      const payalWallet = await mongoose.connection.db
        .collection("wallets")
        .findOne({ userId: payalUser._id });
        
      if (payalWallet) {
        console.log(`   Wallet - Winning Balance: ₹${payalWallet.winningBalance || 0}`);
        console.log(`   Wallet - Total Balance: ₹${payalWallet.balance || 0}`);
      } else {
        console.log(`   ❌ No wallet found for this user!`);
      }

      // Check their bets
      const payalBets = await mongoose.connection.db
        .collection("bets")
        .find({ userId: payalUser._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
        
      console.log(`   Recent bets: ${payalBets.length}`);
      payalBets.forEach((bet, i) => {
        console.log(`     ${i+1}. ₹${bet.amount} ${bet.betType} - ${bet.isWinner ? 'WON ₹' + (bet.potentialWinning || bet.winningAmount || 0) : 'LOST'}`);
      });
    } else {
      console.log(`\n❌ No user found matching "payal"`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔐 Database connection closed");
  }
};

checkWinnings()
  .then(() => {
    console.log("✅ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Check failed:", error);
    process.exit(1);
  });
