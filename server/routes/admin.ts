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
    console.log("��� getAllUsers: Request received");
    console.log("🔍 getAllUsers: Query params:", req.query);
    console.log("🔍 getAllUsers: Auth header present:", !!req.headers.authorization);

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

    console.log("🔍 getAllUsers: Found", usersWithWallets.length, "users out of", totalUsers, "total");

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
    console.log('🔍 getAllBets: Request received');
    console.log('🔍 getAllBets: Query params:', req.query);
    console.log('🔍 getAllBets: Auth header present:', !!req.headers.authorization);

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

    console.log('🔍 getAllBets: Found', bets.length, 'bets out of', totalBets, 'total');

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

// Admin Management Functions

// Get all admins
export const getAdmins: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: any = { role: { $in: ["admin", "superadmin"] } };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    const [admins, totalAdmins] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      User.countDocuments(query),
    ]);

    // Transform the data to match frontend interface
    const transformedAdmins = admins.map((admin) => ({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role === "superadmin" ? "super_admin" : admin.role,
      status: admin.isActive ? "active" : "inactive",
      permissions: getPermissionsForRole(admin.role === "superadmin" ? "super_admin" : admin.role),
      lastLogin: admin.lastLogin?.toISOString() || "",
      createdAt: admin.createdAt.toISOString(),
      updatedAt: (admin as any).updatedAt?.toISOString() || admin.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: transformedAdmins,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAdmins / limit),
        totalAdmins,
        hasNext: page * limit < totalAdmins,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new admin
export const createAdmin: RequestHandler = async (req, res) => {
  try {
    console.log("🔥 createAdmin API called with data:", req.body);
    const { fullName, email, mobile, password, role, permissions } = req.body;
    const adminUser = (req as AdminRequest).admin;

    console.log("📱 Mobile value received:", mobile, "Type:", typeof mobile, "Length:", mobile?.length);

    // Validation
    if (!fullName || !email || !mobile || !password || !role) {
      console.log("❌ Validation failed - missing fields");
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      res.status(400).json({ message: "Invalid mobile number format" });
      return;
    }

    // Check if admin already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      console.log(`❌ Admin creation failed: User already exists - Email: ${existingUser.email}, Mobile: ${existingUser.mobile}, Role: ${existingUser.role}`);
      res.status(400).json({
        message: existingUser.email === email
          ? `Admin with email '${email}' already exists`
          : `Admin with mobile number '${mobile}' already exists`
      });
      return;
    }

    // Convert frontend role to backend role
    const backendRole = role === "super_admin" ? "superadmin" : role;

    console.log("💾 About to create user with data:", {
      fullName,
      email,
      mobile,
      password: "***hidden***",
      role: backendRole,
      isActive: true,
      isVerified: true,
    });

    // Create new admin
    const newAdmin = await User.create({
      fullName,
      email,
      mobile,
      password,
      role: backendRole,
      isActive: true,
      isVerified: true,
    });

    // Log admin creation activity
    await logAdminActivity(
      adminUser?._id?.toString() || "system",
      adminUser?.fullName || "System",
      "admin_created",
      `Created new ${role} account for ${email}`,
      req.ip || "unknown",
      req.get("User-Agent") || "unknown"
    );

    // Return created admin data (without password)
    const adminData = {
      _id: newAdmin._id,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      mobile: newAdmin.mobile,
      role: role,
      status: "active",
      permissions: getPermissionsForRole(role),
      lastLogin: "",
      createdAt: newAdmin.createdAt.toISOString(),
      updatedAt: newAdmin.createdAt.toISOString(),
    };

    console.log("✅ Admin created successfully:", adminData);
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminData,
    });
  } catch (error: any) {
    console.error("❌ Create admin error:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Admin with this email already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Update admin
export const updateAdmin: RequestHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { fullName, email, mobile, password, role } = req.body;
    const adminUser = (req as AdminRequest).admin;

    const admin = await User.findById(adminId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    if (admin.role !== "admin" && admin.role !== "superadmin") {
      res.status(400).json({ message: "User is not an admin" });
      return;
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (mobile) {
      // Validate mobile number format
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        res.status(400).json({ message: "Invalid mobile number format" });
        return;
      }
      admin.mobile = mobile;
    }
    if (password) admin.password = password; // Will be hashed by pre-save hook
    if (role) {
      admin.role = role === "super_admin" ? "superadmin" : role;
    }

    await admin.save();

    // Log admin update activity
    await logAdminActivity(
      adminUser?._id?.toString() || "system",
      adminUser?.fullName || "System",
      "admin_updated",
      `Updated admin account ${email}`,
      req.ip || "unknown",
      req.get("User-Agent") || "unknown"
    );

    // Return updated admin data (without password)
    const adminData = {
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role === "superadmin" ? "super_admin" : admin.role,
      status: admin.isActive ? "active" : "inactive",
      permissions: getPermissionsForRole(admin.role === "superadmin" ? "super_admin" : admin.role),
      lastLogin: admin.lastLogin?.toISOString() || "",
      createdAt: admin.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: "Admin updated successfully",
      data: adminData,
    });
  } catch (error: any) {
    console.error("Update admin error:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Email already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Delete admin
export const deleteAdmin: RequestHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const adminUser = (req as AdminRequest).admin;

    const admin = await User.findById(adminId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    if (admin.role !== "admin" && admin.role !== "superadmin") {
      res.status(400).json({ message: "User is not an admin" });
      return;
    }

    // Prevent self-deletion
    if (adminId === adminUser?._id?.toString()) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }

    await User.findByIdAndDelete(adminId);

    // Log admin deletion activity
    await logAdminActivity(
      adminUser?._id?.toString() || "system",
      adminUser?.fullName || "System",
      "admin_deleted",
      `Deleted admin account ${admin.email}`,
      req.ip || "unknown",
      req.get("User-Agent") || "unknown"
    );

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get admin activities
export const getAdminActivities: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const adminId = req.query.adminId as string;
    const action = req.query.action as string;

    // For now, return mock data since we need to implement activity logging
    const mockActivities = [
      {
        _id: "1",
        adminId: "admin_1",
        adminName: "Super Admin",
        action: "admin_created",
        description: "Created new admin account",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "2",
        adminId: "admin_2",
        adminName: "Game Admin",
        action: "game_result_declared",
        description: "Declared result for Delhi Bazar",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0...",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: mockActivities,
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalActivities: mockActivities.length,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    console.error("Get admin activities error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper functions
function getPermissionsForRole(role: string): string[] {
  const availablePermissions = [
    "users_view",
    "users_edit",
    "users_delete",
    "games_view",
    "games_edit",
    "games_create",
    "games_delete",
    "transactions_view",
    "transactions_edit",
    "results_declare",
    "reports_view",
    "reports_export",
    "settings_view",
    "settings_edit",
    "admin_management",
  ];

  const rolePermissions = {
    super_admin: availablePermissions,
    admin: [
      "users_view",
      "users_edit",
      "games_view",
      "games_edit",
      "transactions_view",
      "results_declare",
      "reports_view",
    ],
    moderator: [
      "users_view",
      "games_view",
      "transactions_view",
      "reports_view",
    ],
  };

  return rolePermissions[role as keyof typeof rolePermissions] || [];
}

async function logAdminActivity(
  adminId: string,
  adminName: string,
  action: string,
  description: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    // For now, just log to console. Later we can implement proper activity logging
    console.log(`Admin Activity - ${adminName} (${adminId}): ${action} - ${description}`);
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
}
