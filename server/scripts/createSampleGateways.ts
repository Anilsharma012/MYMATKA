import mongoose from "mongoose";
import PaymentGateway from "../models/PaymentGateway";
import User from "../models/User";
import connectDB from "../config/database";

async function createSampleGateways() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error("Admin user not found");
      process.exit(1);
    }

    // Check if gateways already exist
    const existingGateways = await PaymentGateway.find();
    if (existingGateways.length > 0) {
      console.log("Payment gateways already exist:", existingGateways.length);
      process.exit(0);
    }

    // Create sample UPI gateway
    const upiGateway = new PaymentGateway({
      type: "upi",
      name: "primary_upi",
      displayName: "Matka Payment UPI",
      upiId: "matkahub@paytm",
      qrCodeUrl: "https://cdn.matkahub.com/qr/primary_upi.jpg",
      minAmount: 10,
      maxAmount: 50000,
      processingTime: "Instant",
      adminNotes: "Primary UPI gateway for user payments",
      isActive: true,
      createdBy: adminUser._id,
    });

    // Create sample bank gateway
    const bankGateway = new PaymentGateway({
      type: "bank",
      name: "primary_bank",
      displayName: "MATKA GAMING PVT LTD",
      accountHolderName: "MATKA GAMING PVT LTD",
      accountNumber: "1234567890123456",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      branchName: "Main Branch",
      minAmount: 100,
      maxAmount: 100000,
      processingTime: "1-2 hours",
      adminNotes: "Primary bank account for large transactions",
      isActive: true,
      createdBy: adminUser._id,
    });

    // Create sample crypto gateway
    const cryptoGateway = new PaymentGateway({
      type: "crypto",
      name: "primary_crypto",
      displayName: "A-coins Wallet",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      network: "BSC",
      minAmount: 50,
      maxAmount: 200000,
      processingTime: "10-30 minutes",
      adminNotes: "Crypto wallet for advanced users",
      isActive: true,
      createdBy: adminUser._id,
    });

    // Save all gateways
    await Promise.all([
      upiGateway.save(),
      bankGateway.save(),
      cryptoGateway.save(),
    ]);

    console.log("Sample payment gateways created successfully!");
    console.log("Created gateways:");
    console.log("- UPI Gateway:", upiGateway.displayName);
    console.log("- Bank Gateway:", bankGateway.displayName);
    console.log("- Crypto Gateway:", cryptoGateway.displayName);

    process.exit(0);
  } catch (error) {
    console.error("Error creating sample gateways:", error);
    process.exit(1);
  }
}

createSampleGateways();
