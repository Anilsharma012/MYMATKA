import { RequestHandler } from "express";
import User from "../models/User";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";

// Admin endpoint to manually credit user balance
export const creditUserBalance: RequestHandler = async (req, res) => {
  try {
    const { userId, amount, type, description } = req.body;

    // Validate input
    if (!userId || !amount || amount <= 0) {
      res.status(400).json({ 
        success: false, 
        message: "User ID and valid amount are required" 
      });
      return;
    }

    const creditType = type || "winning";
    const creditDescription = description || `Manual credit - ${creditType}`;

    console.log(`💰 Admin crediting ₹${amount} to user ${userId} as ${creditType}`);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
      return;
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      console.log(`📝 Creating new wallet for user ${user.fullName}`);
      wallet = new Wallet({
        userId,
        balance: 0,
        winningBalance: 0,
        depositBalance: 0,
        bonusBalance: 0,
        commissionBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalWinnings: 0,
        totalBets: 0
      });
      await wallet.save();
    }

    // Record the credit transaction
    const transaction = new Transaction({
      userId,
      type: creditType,
      amount,
      status: "completed",
      description: creditDescription,
      balanceAfter: 0, // Will be updated after wallet update
      adminNotes: `Manual credit by admin: ${creditDescription}`
    });

    // Credit the appropriate balance
    switch (creditType) {
      case "winning":
        wallet.winningBalance += amount;
        wallet.totalWinnings += amount;
        user.totalWinnings += amount;
        break;
      case "deposit":
        wallet.depositBalance += amount;
        wallet.totalDeposits += amount;
        user.totalDeposits += amount;
        break;
      case "bonus":
        wallet.bonusBalance += amount;
        break;
      case "commission":
        wallet.commissionBalance += amount;
        break;
      default:
        wallet.depositBalance += amount;
    }

    // Update total balance
    wallet.balance = wallet.winningBalance + wallet.depositBalance + wallet.bonusBalance + wallet.commissionBalance;
    
    // Set transaction balance after
    transaction.balanceAfter = wallet.balance;

    // Save all changes
    await Promise.all([
      user.save(),
      wallet.save(),
      transaction.save()
    ]);

    console.log(`✅ Successfully credited ₹${amount} to ${user.fullName}`);
    console.log(`   New wallet balance: ₹${wallet.balance}`);
    console.log(`   New winning balance: ₹${wallet.winningBalance}`);

    res.json({
      success: true,
      message: `Successfully credited ₹${amount} to ${user.fullName}`,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobile: user.mobile
        },
        wallet: {
          balance: wallet.balance,
          winningBalance: wallet.winningBalance,
          depositBalance: wallet.depositBalance,
          bonusBalance: wallet.bonusBalance,
          commissionBalance: wallet.commissionBalance
        },
        transaction: {
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description
        }
      }
    });

  } catch (error) {
    console.error("Error crediting user balance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while crediting balance" 
    });
  }
};
