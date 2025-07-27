const mongoose = require("mongoose");
require("dotenv").config();

const testWinningCredit = async () => {
  try {
    console.log("🔄 Testing winning credit to wallet...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/matka_game"
    );

    console.log("✅ Connected to database");

    // Find the user with mobile starting with 888888
    const testUser = await mongoose.connection.db
      .collection("users")
      .findOne({ mobile: /^888888/ });

    if (!testUser) {
      console.log("❌ No test user found with mobile starting with 888888");
      return;
    }

    console.log(`🎯 Found test user: ${testUser.fullName} (${testUser.mobile})`);

    // Get current wallet state
    let wallet = await mongoose.connection.db
      .collection("wallets")
      .findOne({ userId: testUser._id });

    console.log("💰 Current wallet state:");
    if (wallet) {
      console.log(`   Total Balance: ₹${wallet.balance || 0}`);
      console.log(`   Winning Balance: ₹${wallet.winningBalance || 0}`);
      console.log(`   Total Winnings: ₹${wallet.totalWinnings || 0}`);
    } else {
      console.log("   ❌ No wallet found - creating one...");
      
      wallet = {
        userId: testUser._id,
        balance: 0,
        winningBalance: 0,
        depositBalance: 10000, // Give them some deposit balance
        bonusBalance: 0,
        commissionBalance: 0,
        totalDeposits: 10000,
        totalWithdrawals: 0,
        totalWinnings: 0,
        totalBets: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoose.connection.db.collection("wallets").insertOne(wallet);
      console.log("✅ Created wallet with ₹10,000 deposit balance");
    }

    // Simulate a winning bet credit
    const winningAmount = 9500;
    console.log(`\n🎲 Simulating winning credit of ₹${winningAmount}...`);

    // Update both User and Wallet models (like our fixed code does)
    await Promise.all([
      mongoose.connection.db.collection("users").updateOne(
        { _id: testUser._id },
        {
          $inc: {
            totalWinnings: winningAmount
          }
        }
      ),
      mongoose.connection.db.collection("wallets").updateOne(
        { userId: testUser._id },
        {
          $inc: {
            winningBalance: winningAmount,
            totalWinnings: winningAmount
          }
        }
      )
    ]);

    // Recalculate total balance in wallet
    await mongoose.connection.db.collection("wallets").updateOne(
      { userId: testUser._id },
      {
        $set: {
          balance: (wallet.winningBalance || 0) + winningAmount + (wallet.depositBalance || 0) + (wallet.bonusBalance || 0) + (wallet.commissionBalance || 0)
        }
      }
    );

    console.log("✅ Credit completed!");

    // Check final state
    const updatedWallet = await mongoose.connection.db
      .collection("wallets")
      .findOne({ userId: testUser._id });

    const updatedUser = await mongoose.connection.db
      .collection("users")
      .findOne({ _id: testUser._id });

    console.log("\n💰 Final state:");
    console.log("User model:");
    console.log(`   Total Winnings: ₹${updatedUser.totalWinnings || 0}`);
    console.log("Wallet model:");
    console.log(`   Total Balance: ₹${updatedWallet.balance || 0}`);
    console.log(`   Winning Balance: ₹${updatedWallet.winningBalance || 0}`);
    console.log(`   Deposit Balance: ₹${updatedWallet.depositBalance || 0}`);
    console.log(`   Total Winnings: ₹${updatedWallet.totalWinnings || 0}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔐 Database connection closed");
  }
};

testWinningCredit()
  .then(() => {
    console.log("✅ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
