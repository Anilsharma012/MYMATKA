import { RequestHandler } from "express";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import PaymentRequest from "../models/PaymentRequest";

// Get user wallet balance and details
export const getWalletBalance: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    console.log(`💰 Wallet balance request for user ${userId}:`);
    console.log(`   Winning Balance: ₹${wallet.winningBalance}`);
    console.log(`   Total Balance: ₹${wallet.balance}`);
    console.log(`   Deposit Balance: ₹${wallet.depositBalance}`);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user wallet transactions history
export const getWalletTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string; // deposit, withdrawal, winning, bet

    const query: any = { userId };
    if (type && type !== "all") {
      query.type = type;
    }

    const [transactions, totalTransactions] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalTransactions,
          hasNext: page * limit < totalTransactions,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get wallet transactions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user deposit history (including payment requests)
export const getDepositHistory: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [paymentRequests, totalRequests] = await Promise.all([
      PaymentRequest.find({ userId })
        .populate("gatewayId", "displayName type")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      PaymentRequest.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: {
        deposits: paymentRequests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRequests / limit),
          totalRequests,
          hasNext: page * limit < totalRequests,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get deposit history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get wallet statistics
export const getWalletStats: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.json({
        success: true,
        data: {
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalWinnings: 0,
          totalBets: 0,
          pendingDeposits: 0,
          approvedDeposits: 0,
        },
      });
      return;
    }

    // Get payment request statistics
    const [pendingDeposits, approvedDeposits] = await Promise.all([
      PaymentRequest.aggregate([
        { $match: { userId, status: "pending" } },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),
      PaymentRequest.aggregate([
        { $match: { userId, status: "approved" } },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),
    ]);

    const stats = {
      totalDeposits: wallet.totalDeposits,
      totalWithdrawals: wallet.totalWithdrawals,
      totalWinnings: wallet.totalWinnings,
      totalBets: wallet.totalBets,
      pendingDeposits: pendingDeposits[0]?.total || 0,
      pendingCount: pendingDeposits[0]?.count || 0,
      approvedDeposits: approvedDeposits[0]?.total || 0,
      approvedCount: approvedDeposits[0]?.count || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get wallet stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit withdrawal request
export const submitWithdrawalRequest: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { amount, bankDetails } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      res.status(400).json({ message: "Invalid withdrawal amount" });
      return;
    }

    if (
      !bankDetails ||
      !bankDetails.bankName ||
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode
    ) {
      res.status(400).json({ message: "Complete bank details are required" });
      return;
    }

    // Check user wallet balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ message: "Wallet not found" });
      return;
    }

    // Check if user has sufficient balance (checking winning balance for withdrawals)
    if (wallet.winningBalance < amount) {
      res.status(400).json({
        message: "Insufficient winning balance for withdrawal",
        currentBalance: wallet.winningBalance,
      });
      return;
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId,
      type: "withdrawal",
      amount,
      status: "pending",
      description: `Withdrawal request to ${bankDetails.bankName}`,
      bankDetails: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName || bankDetails.name,
      },
      balanceAfter: wallet.winningBalance - amount,
    });

    await transaction.save();

    // Deduct amount from winning balance (hold it until approval)
    wallet.winningBalance -= amount;
    await wallet.save();

    await transaction.populate("userId", "fullName mobile email");

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Submit withdrawal request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
