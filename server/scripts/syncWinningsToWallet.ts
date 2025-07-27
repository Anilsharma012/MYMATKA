import mongoose from "mongoose";
import User from "../models/User";
import Wallet from "../models/Wallet";

const syncWinningsToWallet = async () => {
  try {
    console.log("🔄 Starting winnings sync from User to Wallet models...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/matka_game"
    );

    console.log("✅ Connected to database");

    // Find all users with winningBalance > 0
    const usersWithWinnings = await User.find({
      $or: [
        { winningBalance: { $gt: 0 } },
        { totalWinnings: { $gt: 0 } }
      ]
    });

    console.log(`📊 Found ${usersWithWinnings.length} users with winnings to sync`);

    let syncedCount = 0;
    let updatedCount = 0;

    for (const user of usersWithWinnings) {
      try {
        console.log(`💰 Syncing user: ${user.fullName} (${user.mobile})`);
        console.log(`   Winning Balance: ₹${user.winningBalance || 0}`);
        console.log(`   Total Winnings: ₹${user.totalWinnings || 0}`);

        // Find or create wallet for this user
        let wallet = await Wallet.findOne({ userId: user._id });
        
        if (!wallet) {
          // Create new wallet with user's winnings
          wallet = new Wallet({
            userId: user._id,
            balance: (user.winningBalance || 0) + (user.depositBalance || 0) + (user.bonusBalance || 0),
            winningBalance: user.winningBalance || 0,
            depositBalance: user.depositBalance || 0,
            bonusBalance: user.bonusBalance || 0,
            commissionBalance: user.commissionBalance || 0,
            totalDeposits: user.totalDeposits || 0,
            totalWithdrawals: user.totalWithdrawals || 0,
            totalWinnings: user.totalWinnings || 0,
            totalBets: user.totalBets || 0
          });
          await wallet.save();
          syncedCount++;
          console.log(`   ✅ Created new wallet with winnings`);
        } else {
          // Update existing wallet with user's winnings if wallet has less
          const userWinningBalance = user.winningBalance || 0;
          const userTotalWinnings = user.totalWinnings || 0;
          
          if (wallet.winningBalance < userWinningBalance || wallet.totalWinnings < userTotalWinnings) {
            const winningBalanceDiff = Math.max(0, userWinningBalance - wallet.winningBalance);
            const totalWinningsDiff = Math.max(0, userTotalWinnings - wallet.totalWinnings);
            
            wallet.winningBalance = Math.max(wallet.winningBalance, userWinningBalance);
            wallet.totalWinnings = Math.max(wallet.totalWinnings, userTotalWinnings);
            
            // Update total balance
            wallet.balance = wallet.winningBalance + wallet.depositBalance + wallet.bonusBalance + wallet.commissionBalance;
            
            await wallet.save();
            updatedCount++;
            console.log(`   ✅ Updated wallet: +₹${winningBalanceDiff} winning, +₹${totalWinningsDiff} total`);
          } else {
            console.log(`   ⏭️  Wallet already has correct or higher winnings`);
          }
        }

        console.log(`   Final Wallet - Winning: ₹${wallet.winningBalance}, Total: ₹${wallet.totalWinnings}\n`);

      } catch (userError) {
        console.error(`❌ Error syncing user ${user.fullName}:`, userError);
      }
    }

    console.log("📈 Sync Summary:");
    console.log(`   • New wallets created: ${syncedCount}`);
    console.log(`   • Existing wallets updated: ${updatedCount}`);
    console.log(`   • Total users processed: ${usersWithWinnings.length}`);
    console.log("✅ Winnings sync completed successfully!");

  } catch (error) {
    console.error("❌ Error during winnings sync:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔐 Database connection closed");
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  console.log("🚀 Running winnings sync migration...");
  syncWinningsToWallet()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export default syncWinningsToWallet;
