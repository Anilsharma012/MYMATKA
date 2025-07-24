import { RequestHandler } from "express";
import mongoose from "mongoose";
import PaymentGateway from "../models/PaymentGateway";
import PaymentRequest from "../models/PaymentRequest";
import User from "../models/User";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import { AdminRequest } from "../middleware/adminAuth";

// Get all payment gateways (admin)
export const getAllGateways: RequestHandler = async (req, res) => {
  try {
    const gateways = await PaymentGateway.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      total: gateways.length,
      active: gateways.filter((g) => g.isActive).length,
      upi: gateways.filter((g) => g.type === "upi").length,
      bank: gateways.filter((g) => g.type === "bank").length,
      crypto: gateways.filter((g) => g.type === "crypto").length,
    };

    res.json({
      success: true,
      data: {
        gateways,
        stats,
      },
    });
  } catch (error) {
    console.error("Get all gateways error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new payment gateway (admin)
export const createGateway: RequestHandler = async (req, res) => {
  try {
    const adminUser = (req as AdminRequest).admin;
    const gatewayData = {
  ...req.body,
  name: req.body.name?.trim() || `${req.body.type}_${Date.now()}`, // ✅ yeh line add karo
  createdBy: adminUser?._id,
};

    const gateway = new PaymentGateway(gatewayData);
    await gateway.save();

    await gateway.populate("createdBy", "fullName email");

    res.status(201).json({
      success: true,
      message: "Payment gateway created successfully",
      data: gateway,
    });
  } catch (error: any) {
    console.error("Create gateway error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Update payment gateway (admin)
export const updateGateway: RequestHandler = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const adminUser = (req as AdminRequest).admin;

    const gateway = await PaymentGateway.findByIdAndUpdate(
      gatewayId,
      req.body,
      { new: true, runValidators: true },
    ).populate("createdBy", "fullName email");

    if (!gateway) {
      res.status(404).json({ message: "Payment gateway not found" });
      return;
    }

    res.json({
      success: true,
      message: "Payment gateway updated successfully",
      data: gateway,
    });
  } catch (error: any) {
    console.error("Update gateway error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Delete payment gateway (admin)
export const deleteGateway: RequestHandler = async (req, res) => {
  try {
    const { gatewayId } = req.params;

    // Check if gateway has pending payment requests
    const pendingRequests = await PaymentRequest.countDocuments({
      gatewayId,
      status: { $in: ["pending", "processing"] },
    });

    if (pendingRequests > 0) {
      res.status(400).json({
        message: `Cannot delete gateway with ${pendingRequests} pending payment requests`,
      });
      return;
    }

    const gateway = await PaymentGateway.findByIdAndDelete(gatewayId);

    if (!gateway) {
      res.status(404).json({ message: "Payment gateway not found" });
      return;
    }

    res.json({
      success: true,
      message: "Payment gateway deleted successfully",
    });
  } catch (error) {
    console.error("Delete gateway error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active payment gateways (public for users)
export const getActiveGateways: RequestHandler = async (req, res) => {
  try {
    const gateways = await PaymentGateway.find({ isActive: true })
      .select("-adminNotes -createdBy")
      .sort({ type: 1, createdAt: -1 });

    res.json({
      success: true,
      data: gateways,
    });
  } catch (error) {
    console.error("Get active gateways error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit payment request (user)
export const submitPaymentRequest: RequestHandler = async (req, res) => {
  try {
    const { gatewayId, amount, transactionId, paymentProofUrl, userNotes } =
      req.body;
    const userId = (req as any).user._id;

    // Validate gateway exists and is active
    const gateway = await PaymentGateway.findOne({
      _id: gatewayId,
      isActive: true,
    });

    if (!gateway) {
      res
        .status(404)
        .json({ message: "Payment gateway not found or inactive" });
      return;
    }

    // Validate amount limits
    if (amount < (gateway.minAmount || 10)) {
      res.status(400).json({
        message: `Minimum amount is ₹${gateway.minAmount || 10}`,
      });
      return;
    }

    if (amount > (gateway.maxAmount || 100000)) {
      res.status(400).json({
        message: `Maximum amount is ₹${gateway.maxAmount || 100000}`,
      });
      return;
    }

    // Check for duplicate transaction ID
    if (transactionId) {
      const existingRequest = await PaymentRequest.findOne({
        transactionId,
        status: { $ne: "rejected" },
      });

      if (existingRequest) {
        res.status(400).json({
          message: "Transaction ID already exists",
        });
        return;
      }
    }

    const paymentRequest = new PaymentRequest({
      userId,
      gatewayId,
      amount,
      transactionId,
      paymentProofUrl,
      userNotes,
      ipAddress: req.ip,
      deviceInfo: req.get("User-Agent"),
    });

    await paymentRequest.save();
    await paymentRequest.populate(
      "gatewayId",
      "displayName type processingTime",
    );

    res.status(201).json({
      success: true,
      message: "Payment request submitted successfully",
      data: paymentRequest,
    });
  } catch (error) {
    console.error("Submit payment request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all payment requests (admin)
export const getAllPaymentRequests: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const gatewayType = req.query.gatewayType as string;

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    let gatewayIds: string[] = [];
    if (gatewayType && gatewayType !== "all") {
      const gateways = await PaymentGateway.find({ type: gatewayType }, "_id");
      gatewayIds = gateways.map((g) => g._id.toString());
      query.gatewayId = { $in: gatewayIds };
    }

    const [requests, totalRequests] = await Promise.all([
      PaymentRequest.find(query)
        .populate("userId", "fullName mobile email")
        .populate("gatewayId", "displayName type")
        .populate("reviewedBy", "fullName")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      PaymentRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        requests,
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
    console.error("Get all payment requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Process payment request (admin)
export const processPaymentRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
    const adminUser = (req as AdminRequest).admin;

    const paymentRequest =
      await PaymentRequest.findById(requestId).populate("userId gatewayId");

    if (!paymentRequest) {
      res.status(404).json({ message: "Payment request not found" });
      return;
    }

    if (paymentRequest.status !== "pending") {
      res.status(400).json({ message: "Payment request already processed" });
      return;
    }

    paymentRequest.status = action === "approve" ? "approved" : "rejected";
    paymentRequest.adminNotes = adminNotes;
    paymentRequest.reviewedBy = adminUser?._id as mongoose.Types.ObjectId;
    paymentRequest.reviewedAt = new Date();

    if (action === "reject") {
      paymentRequest.rejectionReason = adminNotes;
    }

    await paymentRequest.save();

    // If approved, add money to user's wallet
    if (action === "approve") {
      let wallet = await Wallet.findOne({ userId: paymentRequest.userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId: paymentRequest.userId });
      }

      wallet.depositBalance += paymentRequest.amount;
      wallet.totalDeposits += paymentRequest.amount;
      await wallet.save();

      // Create transaction record
      await Transaction.create({
        userId: paymentRequest.userId,
        type: "deposit",
        amount: paymentRequest.amount,
        status: "completed",
        description: `Deposit via ${(paymentRequest.gatewayId as any).displayName}`,
        referenceId: paymentRequest.referenceId,
        processedBy: adminUser?._id as mongoose.Types.ObjectId,
        processedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: `Payment request ${action === "approve" ? "approved" : "rejected"} successfully`,
      data: paymentRequest,
    });
  } catch (error) {
    console.error("Process payment request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's payment requests (user)
export const getUserPaymentRequests: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [requests, totalRequests] = await Promise.all([
      PaymentRequest.find({ userId })
        .populate("gatewayId", "displayName type processingTime")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      PaymentRequest.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: {
        requests,
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
    console.error("Get user payment requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload QR code or payment proof
export const uploadFile: RequestHandler = async (req, res) => {
  try {
    // Check if file was uploaded via multer
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file provided",
      });
      return;
    }

    // Generate the URL for the uploaded file
    const fileUrl = `/api/uploads/${req.file.filename}`;

    console.log("✅ File uploaded successfully:", req.file.filename);

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
    });
  }
};
