import { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import Bet from "../models/Bet";
import { AdminRequest } from "../middleware/adminAuth";

// Dashboard Statistics
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      pendingWithdrawals,
      todayBets,
      totalDeposits,
      totalWithdrawals,
      totalWinnings,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ type: "withdrawal", status: "pending" }),
      Bet.countDocuments({
        placedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Transaction.aggregate([
        { $match: { type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdrawal", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "win", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalTransactions,
      pendingWithdrawals,
      todayBets,
      totalDeposits: totalDeposits[0]?.total || 0,
      totalWithdrawals: totalWithdrawals[0]?.total || 0,
      totalWinnings: totalWinnings[0]?.total || 0,
      profit:
        (totalDeposits[0]?.total || 0) -
        (totalWithdrawals[0]?.total || 0) -
        (totalWinnings[0]?.total || 0),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users with pagination
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = { role: "user" };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select("-password")
        .populate("referredBy", "fullName mobile")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      User.countDocuments(query),
    ]);

    // Get wallet information for each user
    const usersWithWallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          wallet: wallet || {
            balance: 0,
            winningBalance: 0,
            depositBalance: 0,
            bonusBalance: 0,
          },
        };
      }),
    );

    res.json({
      success: true,
      data: {
        users: usersWithWallets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page * limit < totalUsers,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user details
export const getUserDetails: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, wallet, recentTransactions, recentBets] = await Promise.all([
      User.findById(userId)
        .select("-password")
        .populate("referredBy", "fullName mobile"),
      Wallet.findOne({ userId }),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10),
      Bet.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        user,
        wallet: wallet || {
          balance: 0,
          winningBalance: 0,
          depositBalance: 0,
          bonusBalance: 0,
        },
        recentTransactions,
        recentBets,
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status
export const updateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const adminUser = (req as AdminRequest).admin;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true },
    ).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Log admin action
    await Transaction.create({
      userId: user._id,
      type: "bonus",
      amount: 0,
      status: "completed",
      description: `Account ${isActive ? "activated" : "deactivated"} by admin`,
      processedBy: (adminUser?._id as mongoose.Types.ObjectId) || null,
      processedAt: new Date(),
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all transactions
export const getAllTransactions: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const userId = req.query.userId as string;

    const query: any = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    const [transactions, totalTransactions] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "fullName mobile email")
        .populate("processedBy", "fullName")
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
    console.error("Get all transactions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Process withdrawal
export const processWithdrawal: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
    const adminUser = (req as AdminRequest).admin;

    const transaction =
      await Transaction.findById(transactionId).populate("userId");

    if (!transaction) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    if (transaction.type !== "withdrawal") {
      res.status(400).json({ message: "Invalid transaction type" });
      return;
    }

    if (transaction.status !== "pending") {
      res.status(400).json({ message: "Transaction already processed" });
      return;
    }

    const newStatus = action === "approve" ? "completed" : "failed";

    // Update transaction
    transaction.status = newStatus;
    transaction.adminNotes = adminNotes;
    transaction.processedBy =
      (adminUser?._id as mongoose.Types.ObjectId) || null;
    transaction.processedAt = new Date();
    await transaction.save();

    // If rejected, refund the amount to user's wallet
    if (action === "reject") {
      const wallet = await Wallet.findOne({ userId: transaction.userId });
      if (wallet) {
        wallet.winningBalance += transaction.amount;
        await wallet.save();
      }
    }

    res.json({
      success: true,
      message: `Withdrawal ${action === "approve" ? "approved" : "rejected"} successfully`,
      data: transaction,
    });
  } catch (error) {
    console.error("Process withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add money to user wallet (admin action)
export const addMoneyToUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, description } = req.body;
    const adminUser = (req as AdminRequest).admin;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: "Invalid amount" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    // Update wallet based on type
    switch (type) {
      case "bonus":
        wallet.bonusBalance += amount;
        break;
      case "deposit":
        wallet.depositBalance += amount;
        wallet.totalDeposits += amount;
        break;
      case "winning":
        wallet.winningBalance += amount;
        break;
      default:
        wallet.depositBalance += amount;
    }

    await wallet.save();

    // Create transaction record
    await Transaction.create({
      userId,
      type: type || "deposit",
      amount,
      status: "completed",
      description: description || `Manual ${type} added by admin`,
      processedBy: (adminUser?._id as mongoose.Types.ObjectId) || null,
      processedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Money added successfully",
      data: wallet,
    });
  } catch (error) {
    console.error("Add money to user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all bets
export const getAllBets: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const gameId = req.query.gameId as string;
    const status = req.query.status as string;
    const userId = req.query.userId as string;

    const query: any = {};

    if (gameId && gameId !== "all") {
      query.gameId = gameId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    const [bets, totalBets] = await Promise.all([
      Bet.find(query)
        .populate("userId", "fullName mobile")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Bet.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBets / limit),
          totalBets,
          hasNext: page * limit < totalBets,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all bets error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
