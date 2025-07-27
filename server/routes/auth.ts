import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "matka-hub-secret-key-2024";

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
};

const checkDatabaseConnection = (): boolean => {
  return mongoose.connection.readyState === 1;
};

const handleDatabaseError = (res: any) => {
  res.status(503).json({
    message:
      "Database unavailable. Please add your IP to MongoDB Atlas whitelist and restart the server.",
  });
};

// Generate unique referral code for user
const generateReferralCode = (name: string, id: string): string => {
  const cleanName = name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const shortId = id.slice(-4);
  return `${cleanName}${shortId}`;
};

export const registerUser: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { fullName, email, mobile, password, referralCode } = req.body;

    if (!fullName || !email || !mobile || !password) {
      res.status(400).json({ message: "All required fields must be provided" });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Mobile number already registered",
      });
      return;
    }

    // Check if referral code is valid
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({
        referralCode: referralCode.toUpperCase(),
      });
      if (!referrer) {
        res.status(400).json({ message: "Invalid referral code" });
        return;
      }
    }

    // Create user first to get ID
    const user = new User({
      fullName,
      email,
      mobile,
      password,
      referredBy: referrer ? referrer._id : undefined,
    });

    await user.save();

    // Generate and set unique referral code
    const userReferralCode = generateReferralCode(
      fullName,
      user._id.toString(),
    );
    user.referralCode = userReferralCode;
    await user.save();

    // Handle referral bonus
    if (referrer) {
      // Add 100 points to referrer
      referrer.points += 100;
      referrer.referredUsers.push(user._id);
      await referrer.save();

      // Also give new user a welcome bonus
      user.points = 50; // Welcome bonus for new user
      await user.save();

      console.log(
        `✅ Referral bonus: ${referrer.fullName} earned 100 points for referring ${user.fullName}`,
      );
    }

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        referralCode: user.referralCode,
        points: user.points,
      },
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      res
        .status(400)
        .json({ message: "Mobile number and password are required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(401)
        .json({ message: "Account is deactivated. Please contact support." });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const forgotPassword: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile } = req.body;

    if (!mobile) {
      res.status(400).json({ message: "Mobile number is required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res
        .status(404)
        .json({ message: "No account found with this mobile number" });
      return;
    }

    res.json({
      message: "Password reset instructions sent successfully",
      mobile: mobile.replace(/(\d{6})(\d{4})/, "******$2"),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

export const adminLogin: RequestHandler = async (req, res) => {
  console.log('🔐 Admin login attempt:', {
    body: req.body,
    mobile: req.body?.mobile,
    hasPassword: !!req.body?.password,
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')?.substring(0, 50)
  });

  if (!checkDatabaseConnection()) {
    console.log('❌ Database connection failed for admin login');
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      res
        .status(400)
        .json({ message: "Mobile number and password are required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    // Check if user has admin privileges
    if (user.role !== "admin" && user.role !== "superadmin") {
      res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(401)
        .json({ message: "Account is deactivated. Please contact support." });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login" });
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const user = (req as any).user;

    // Get referral statistics
    const referralStats = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "referredBy",
          as: "referredUsers",
        },
      },
      {
        $project: {
          totalReferrals: { $size: "$referredUsers" },
          totalEarnings: { $multiply: [{ $size: "$referredUsers" }, 100] },
          points: 1,
        },
      },
    ]);

    const stats = referralStats[0] || {
      totalReferrals: 0,
      totalEarnings: 0,
      points: 0,
    };

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        referralCode: user.referralCode,
        points: user.points || 0,
        createdAt: user.createdAt,
        referralStats: {
          totalReferrals: stats.totalReferrals,
          totalEarnings: stats.totalEarnings,
          pendingEarnings: 0, // Can be calculated based on pending users if needed
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
