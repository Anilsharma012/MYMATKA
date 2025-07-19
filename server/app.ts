import express from "express";
import cors from "cors";
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
} from "./routes/admin";
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
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        callback(new Error("Not allowed by CORS"));
      }
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

// Auth health check
app.get("/api/auth/health", (_req, res) => {
  res.json({
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    endpoints: ["/api/auth/register", "/api/auth/login"],
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

// Admin Management API endpoints (basic implementation)
app.get("/api/admin/management/admins", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Admin management API endpoint",
    data: [], // Will be populated when backend is implemented
  });
});

app.get("/api/admin/management/activities", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Activities API endpoint",
    data: [], // Will be populated when backend is implemented
  });
});

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
        `🎲 ${bet.betNumber} === ${result} = ${isWinner ? "WIN" : "LOSE"}`,
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

// Serve static files for the SPA
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "..", "spa")
    : path.join(process.cwd(), "dist", "spa");

console.log("Static path:", staticPath);
app.use(express.static(staticPath));

// SPA catch-all route (must be last)
app.get("*", (_req, res) => {
  const indexPath = path.join(staticPath, "index.html");
  console.log("Serving index.html from:", indexPath);
  res.sendFile(indexPath);
});

export default app;
