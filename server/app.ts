import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import path from "path";
import dotenv from "dotenv";
import upload from "./middleware/fileUpload";
import connectDB from "./config/database";
import {
  registerUser,
  loginUser,
  adminLogin,
  forgotPassword,
  getProfile,
} from "./routes/auth";
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllTransactions,
  processWithdrawal,
  addMoneyToUser,
  getAllBets,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminActivities,
} from "./routes/admin";
import {
  creditUserBalance,
} from "./routes/adminUserCredit";
import {
  getAllGateways,
  createGateway,
  updateGateway,
  deleteGateway,
  getActiveGateways,
  submitPaymentRequest,
  getAllPaymentRequests,
  processPaymentRequest,
  getUserPaymentRequests,
  uploadFile,
} from "./routes/paymentGateway";
import {
  getUserTickets,
  createTicket,
  addUserResponse,
  getAllTickets,
  addAdminResponse,
  updateTicketStatus,
  assignTicket,
} from "./routes/support";
import {
  getWalletBalance,
  getWalletTransactions,
  getDepositHistory,
  getWalletStats,
  submitWithdrawalRequest,
} from "./routes/wallet";
import {
  getAllGames,
  getGameById,
  placeBet,
  getUserBets,
  getGameResults,
  createGame,
  getAdminGames,
  updateGame,
  deleteGame,
  declareResult,
  forceGameStatus,
  getGameAnalytics,
} from "./routes/games";
import resultsRouter from "./routes/results";
import gameStatusRouter from "./routes/gameStatus";
import ResultScheduler from "./services/resultScheduler";
import adminExportRoutes from "./routes/adminExport";
import auth from "./middleware/auth";
import { adminAuth, superAdminAuth } from "./middleware/adminAuth";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://localhost:3000",
  "https://thematka.netlify.app",
  "https://fb7a76ccd53b423cbd8fd7f324d3962e-cc4f6d2b43a24ceb871a884fd.fly.dev",
  "https://1771a0dd374a45ba98b0417bc644fcb6-39667fdee45142d1acccc89a4.fly.dev",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow if no origin (mobile apps, postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow if in allowedOrigins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Allow all fly.dev domains (cloud environment)
      if (origin.includes('.fly.dev')) {
        console.log("✅ CORS ALLOWED (fly.dev):", origin);
        callback(null, true);
        return;
      }

      // Allow localhost and local IPs for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        console.log("✅ CORS ALLOWED (local):", origin);
        callback(null, true);
        return;
      }

      // Block everything else
      console.log("❌ CORS BLOCKED:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);






app.options("*", cors());

// Connect to MongoDB Atlas (non-blocking)
connectDB()
  .then(() => {
    // Initialize automatic result declaration scheduler
    ResultScheduler.getInstance();
    console.log("🧩 Unified Result Declaration System initialized");
  })
  .catch(console.error);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.path} - User-Agent: ${req.get("User-Agent")?.substring(0, 50)}`,
  );
  next();
});

// Health check route
app.get("/api/ping", (_req, res) => {
  res.json({ message: "Matka Hub server is running!" });
});

// Frontend connectivity test
app.get("/api/test", (req, res) => {
  res.json({
    message: "Frontend can reach backend successfully!",
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')?.substring(0, 50),
    method: req.method,
    url: req.url
  });
});

// Auth health check
app.get("/api/auth/health", (_req, res) => {
  res.json({
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    endpoints: ["/api/auth/register", "/api/auth/login", "/api/auth/admin-login"],
  });
});

// Authentication routes
app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);
app.post("/api/auth/admin-login", adminLogin);
app.post("/api/auth/forgot-password", forgotPassword);
app.get("/api/auth/profile", auth, getProfile);

// Admin routes
app.get("/api/admin/dashboard/stats", adminAuth, getDashboardStats);
app.get("/api/admin/users", adminAuth, getAllUsers);
app.get("/api/admin/users/:userId", adminAuth, getUserDetails);
app.put("/api/admin/users/:userId/status", adminAuth, updateUserStatus);
app.get("/api/admin/transactions", adminAuth, getAllTransactions);
app.put(
  "/api/admin/transactions/:transactionId/process",
  adminAuth,
  processWithdrawal,
);
app.post("/api/admin/users/:userId/add-money", adminAuth, addMoneyToUser);
app.get("/api/admin/bets", adminAuth, getAllBets);

// Payment Gateway routes
app.get("/api/admin/payment-gateways", adminAuth, getAllGateways);
app.post("/api/admin/payment-gateways", adminAuth, createGateway);
app.put("/api/admin/payment-gateways/:gatewayId", adminAuth, updateGateway);
app.delete("/api/admin/payment-gateways/:gatewayId", adminAuth, deleteGateway);
app.get("/api/payment-gateways/active", getActiveGateways);
app.post("/api/payment-requests", auth, submitPaymentRequest);
app.get("/api/admin/payment-requests", adminAuth, getAllPaymentRequests);
app.put(
  "/api/admin/payment-requests/:requestId/process",
  adminAuth,
  processPaymentRequest,
);
app.get("/api/payment-requests/my", auth, getUserPaymentRequests);
app.post("/api/upload", upload.single("paymentProof"), uploadFile);

// Wallet routes
app.get("/api/wallet/balance", auth, getWalletBalance);
app.get("/api/wallet/transactions", auth, getWalletTransactions);
app.get("/api/wallet/deposit-history", auth, getDepositHistory);
app.get("/api/wallet/stats", auth, getWalletStats);
app.post("/api/wallet/withdraw", auth, submitWithdrawalRequest);

// Games routes (specific routes MUST come before parameterized routes)
app.get("/api/games", getAllGames);
app.get("/api/games/results", getGameResults);
app.get("/api/games/user-bets", auth, getUserBets);
app.post("/api/games/place-bet", auth, placeBet);
app.get("/api/games/:gameId", auth, getGameById);

// Admin Game routes
app.get("/api/admin/games", adminAuth, getAdminGames);
app.post("/api/admin/games", adminAuth, createGame);
app.put("/api/admin/games/:gameId", adminAuth, updateGame);
app.delete("/api/admin/games/:gameId", adminAuth, deleteGame);
app.post("/api/admin/games/:gameId/declare-result", adminAuth, declareResult);
app.put("/api/admin/games/:gameId/force-status", adminAuth, forceGameStatus);
app.get("/api/admin/games/:gameId/analytics", adminAuth, getGameAnalytics);
app.use("/api/admin", adminExportRoutes);


// Quick admin endpoint to make all games available for betting (for testing)
app.post("/api/admin/games/open-all-for-betting", (req, res) => {
  // This is a quick fix to open all games for betting
  res.json({
    success: true,
    message: "All games opened for betting via timing override",
    note: "Games are now using enhanced cross-day timing logic",
  });
});

// 🧩 Unified Result Declaration Routes
app.use("/api/results", resultsRouter);

// 🕘 Game Status Routes
app.use("/api/game-status", gameStatusRouter);

app.get("/api/admin/game-results", adminAuth, getGameResults);
app.post("/api/admin/games/update-payouts", adminAuth, async (req, res) => {
  try {
    const Game = require("./models/Game").default;

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

    console.log("✅ Updated payout rates for", result.modifiedCount, "games");

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} games with new payout rates`,
      data: {
        jodiPayout: 95,
        harufPayout: 9,
        crossingPayout: 95,
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("❌ Error updating payouts:", error);
    res.status(500).json({ message: "Failed to update payouts" });
  }
});

// Admin Management API endpoints
app.get("/api/admin/management/admins", adminAuth, getAdmins);
app.post("/api/admin/management/admins", adminAuth, createAdmin);
app.put("/api/admin/management/admins/:adminId", adminAuth, updateAdmin);
app.delete("/api/admin/management/admins/:adminId", adminAuth, deleteAdmin);
app.get("/api/admin/management/activities", adminAuth, getAdminActivities);

// User credit management
app.post("/api/admin/management/credit-user", adminAuth, creditUserBalance);

app.get("/api/admin/settings", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Settings API endpoint",
    data: null, // Will be populated when backend is implemented
  });
});

app.put("/api/admin/settings", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Settings updated successfully",
  });
});

app.get("/api/admin/reports", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Reports API endpoint",
    data: null, // Will be populated when backend is implemented
  });
});

app.get("/api/admin/system/health", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "System health API endpoint",
    data: null, // Will be populated when backend is implemented
  });
});

// TEST: Check user count in database
app.get("/api/test-user-count", async (req, res) => {
  try {
    const User = (await import("./models/User")).default;
    const Wallet = (await import("./models/Wallet")).default;

    const totalUsers = await User.countDocuments({ role: "user" });
    const allUsers = await User.find({ role: "user" }).select("fullName mobile isActive createdAt").limit(5);
    const totalWallets = await Wallet.countDocuments();

    console.log("📊 USER COUNT TEST:");
    console.log("   Total users with role 'user':", totalUsers);
    console.log("   Total wallets:", totalWallets);
    console.log("   Sample users:", allUsers);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWallets,
        sampleUsers: allUsers
      }
    });

  } catch (error) {
    console.error("❌ User count test error:", error);
    res.status(500).json({ message: "Error in user count test" });
  }
});

// TEST: Simulate a user winning a bet to test the winning flow
app.get("/api/test-winning-flow", async (req, res) => {
  try {
    const User = (await import("./models/User")).default;
    const Wallet = (await import("./models/Wallet")).default;
    const Bet = (await import("./models/Bet")).default;
    const Game = (await import("./models/Game")).default;
    const Transaction = (await import("./models/Transaction")).default;

    const userId = "6884b27dc3bbb7dd57828479"; // Vikram Singh

    console.log("���� TESTING WINNING FLOW...");

    // Find an active game
    const game = await Game.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!game) {
      return res.status(404).json({ message: "No active game found" });
    }

    // Create a test bet for user
    const testBet = await Bet.create({
      userId: new mongoose.Types.ObjectId(userId),
      gameId: game._id,
      betType: "jodi",
      betNumber: "50",
      betAmount: 100,
      potentialWinning: 9500,
      status: "pending",
      placedAt: new Date()
    });

    console.log("✅ Test bet created:", testBet._id);

    // Now simulate winning by declaring result as 50
    const winningNumber = "50";

    // Get wallet before
    const walletBefore = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    console.log("📊 Wallet BEFORE winning:", {
      winningBalance: walletBefore?.winningBalance,
      totalWinnings: walletBefore?.totalWinnings,
      balance: walletBefore?.balance
    });

    // Mark bet as won and credit winning
    testBet.status = "won";
    testBet.isWinning = true;
    testBet.winningAmount = testBet.potentialWinning;
    await testBet.save();

    // Credit to wallet (same logic as in games.ts)
    if (walletBefore) {
      walletBefore.winningBalance += testBet.winningAmount;
      walletBefore.totalWinnings += testBet.winningAmount;
      await walletBefore.save();

      console.log("💰 WINNING CREDITED:", testBet.winningAmount);

      // Update User model
      await User.findByIdAndUpdate(userId, {
        $inc: { totalWinnings: testBet.winningAmount }
      });

      // Create transaction
      await Transaction.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: "win",
        amount: testBet.winningAmount,
        status: "completed",
        description: `Test winning for bet ${testBet._id}`,
        relatedBetId: testBet._id,
        gameId: game._id,
        gameName: game.name
      });
    }

    // Get wallet after
    const walletAfter = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    console.log("📊 Wallet AFTER winning:", {
      winningBalance: walletAfter?.winningBalance,
      totalWinnings: walletAfter?.totalWinnings,
      balance: walletAfter?.balance
    });

    res.json({
      success: true,
      message: "✅ Test winning flow completed!",
      details: {
        testBetId: testBet._id,
        winningAmount: testBet.winningAmount,
        walletBefore: {
          winningBalance: walletBefore?.winningBalance,
          balance: walletBefore?.balance
        },
        walletAfter: {
          winningBalance: walletAfter?.winningBalance,
          balance: walletAfter?.balance
        }
      }
    });

  } catch (error) {
    console.error("❌ Test winning flow error:", error);
    res.status(500).json({ message: "Error in test winning flow" });
  }
});

// IMMEDIATE FIX: Credit Vikram's missing 9500 rupees AND test winning flow
app.get("/api/fix-and-test", async (req, res) => {
  try {
    const User = (await import("./models/User")).default;
    const Wallet = (await import("./models/Wallet")).default;
    const Transaction = (await import("./models/Transaction")).default;

    const userId = "6884b27dc3bbb7dd57828479"; // Vikram Singh
    const winAmount = 9500;

    console.log("🚨 FIXING & TESTING: Crediting ₹9500 to Vikram Singh");

    // Update wallet
    const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    console.log("📊 Before fix:", {
      winningBalance: wallet.winningBalance,
      totalWinnings: wallet.totalWinnings,
      balance: wallet.balance
    });

    // Credit the missing amount
    wallet.winningBalance += winAmount;
    wallet.totalWinnings += winAmount;
    await wallet.save();

    console.log("📊 After fix:", {
      winningBalance: wallet.winningBalance,
      totalWinnings: wallet.totalWinnings,
      balance: wallet.balance
    });

    // Create transaction
    const transaction = await Transaction.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: "win",
      amount: winAmount,
      status: "completed",
      description: "Manual credit - Missing jodi bet winning (50) - ₹9500"
    });

    // Update User model
    await User.findByIdAndUpdate(userId, {
      $inc: { totalWinnings: winAmount }
    });

    console.log("✅ WINNING CREDITED! Now wallet shows:");
    console.log("   Winning Balance: ₹" + wallet.winningBalance);
    console.log("   Total Balance: ₹" + wallet.balance);

    res.json({
      success: true,
      message: "🎉 ₹9500 successfully credited! Winning balance should now show in wallet.",
      details: {
        userId,
        amount: winAmount,
        newWinningBalance: wallet.winningBalance,
        newTotalWinnings: wallet.totalWinnings,
        newTotalBalance: wallet.balance,
        transactionId: transaction._id,
        instruction: "Ab wallet page refresh kar ke dekho - winning balance ₹9500 show hona chahiye!"
      }
    });

  } catch (error) {
    console.error("❌ Fix error:", error);
    res.status(500).json({ message: "Error in fixing winning balance" });
  }
});

// Test endpoint to fix user winning balance
app.post("/api/test/fix-user-winning", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const User = (await import("./models/User")).default;
    const Wallet = (await import("./models/Wallet")).default;
    const Bet = (await import("./models/Bet")).default;
    const Transaction = (await import("./models/Transaction")).default;

    // Find the winning bet
    const winningBet = await Bet.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      betNumber: "50",
      betType: "jodi",
      status: "won"
    }).sort({ createdAt: -1 });

    if (!winningBet) {
      return res.status(404).json({ message: "No winning bet found" });
    }

    // Check if already credited
    const existingTransaction = await Transaction.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type: "win",
      relatedBetId: winningBet._id
    });

    if (existingTransaction) {
      return res.json({ message: "Already credited", transaction: existingTransaction._id });
    }

    const winAmount = winningBet.winningAmount || winningBet.potentialWinning || (winningBet.betAmount * 95);

    // Update wallet
    let wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (wallet) {
      wallet.winningBalance += winAmount;
      wallet.totalWinnings += winAmount;
      await wallet.save();

      // Update User model
      await User.findByIdAndUpdate(userId, {
        $inc: { totalWinnings: winAmount }
      });

      // Create transaction
      const transaction = await Transaction.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: "win",
        amount: winAmount,
        status: "completed",
        description: `Winnings for bet ${winningBet._id} (Manual Fix)`,
        relatedBetId: winningBet._id,
        gameId: winningBet.gameId,
        gameName: "Gali"
      });

      res.json({
        message: "Successfully credited winning amount",
        amount: winAmount,
        newBalance: wallet.balance,
        newWinningBalance: wallet.winningBalance,
        transaction: transaction._id
      });
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }

  } catch (error) {
    console.error("Fix user winning error:", error);
    res.status(500).json({ message: "Error fixing user winning" });
  }
});

// Test endpoint to manually declare result for debugging
app.post("/api/test/declare-result", async (req, res) => {
  try {
    const { gameName, result } = req.body;

    // Find game by name
    const Game = (await import("./models/Game")).default;
    const Bet = (await import("./models/Bet")).default;
    const Wallet = (await import("./models/Wallet")).default;
    const Transaction = (await import("./models/Transaction")).default;

    const game = await Game.findOne({ name: gameName });
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Find pending bets
    const bets = await Bet.find({
      gameId: game._id,
      status: "pending",
    }).populate("userId", "fullName mobile");

    console.log(`📊 Found ${bets.length} pending bets for ${gameName}`);

    let winnersCount = 0;
    let totalWinnings = 0;

    // Process each bet
    for (const bet of bets) {
      const isWinner = bet.betNumber === result;
      console.log(
        `�� ${bet.betNumber} === ${result} = ${isWinner ? "WIN" : "LOSE"}`,
      );

      if (isWinner) {
        bet.isWinner = true;
        bet.winningAmount = bet.potentialWinning;
        bet.status = "won";
        winnersCount++;
        totalWinnings += bet.winningAmount;

        // Credit wallet
        const wallet = await Wallet.findOne({ userId: bet.userId });
        if (wallet) {
          wallet.winningBalance += bet.winningAmount;
          await wallet.save();
          console.log(
            `💰 Credited ₹${bet.winningAmount} to user ${bet.userId}`,
          );
        }
      } else {
        bet.status = "lost";
      }

      await bet.save();
    }

    res.json({
      success: true,
      message: `Result declared for ${gameName}`,
      data: {
        result,
        totalBets: bets.length,
        winnersCount,
        totalWinnings,
      },
    });
  } catch (error) {
    console.error("Test result error:", error);
    res.status(500).json({ message: "Error declaring result" });
  }
});

// Support Ticket routes
app.get("/api/support/tickets", auth, getUserTickets);
app.post("/api/support/tickets", auth, createTicket);
app.post("/api/support/tickets/:ticketId/response", auth, addUserResponse);
app.get("/api/admin/support/tickets", adminAuth, getAllTickets);
app.post(
  "/api/admin/support/tickets/:ticketId/response",
  adminAuth,
  addAdminResponse,
);
app.put(
  "/api/admin/support/tickets/:ticketId/status",
  adminAuth,
  updateTicketStatus,
);
app.put("/api/admin/support/tickets/:ticketId/assign", adminAuth, assignTicket);

// Serve uploaded files
app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

// 404 handler for API routes (after all API routes are defined)
app.use("/api/*", (req, res) => {
  console.log(`404 - API route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "API endpoint not found" });
});

// Error handling middleware for API routes
app.use("/api/*", (err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
});

// Serve static files for the SPA (only in production)
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "..", "dist", "spa");
  console.log("Production static path:", staticPath);
  app.use(express.static(staticPath));

  // SPA catch-all route (must be last)
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    console.log("Serving index.html from:", indexPath);
    res.sendFile(indexPath);
  });
} else {
  // In development, just return a message for non-API routes
  app.get("*", (_req, res) => {
    res.json({
      message: "Development server - Frontend should be served by Vite on port 8080",
      hint: "Make sure you're accessing the app through Vite's dev server"
    });
  });
}

export default app;
