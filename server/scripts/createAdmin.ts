import mongoose from "mongoose";
import User from "../models/User";
import Wallet from "../models/Wallet";

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb+srv://sachintakroia:Sachin123@cluster5.4ihtya2.mongodb.net/matka-hub";

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { role: "admin" },
        { email: "admin@matkahub.com" },
        { mobile: "8888888888" },
      ],
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);

      // Update existing user to admin if not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        existingAdmin.isActive = true;
        existingAdmin.isVerified = true;
        await existingAdmin.save();
        console.log("Updated existing user to admin role");
      }
      return;
    }

    // Create admin user
    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@matkahub.com",
      mobile: "8888888888",
      password: "admin@123",
      role: "admin",
      isActive: true,
      isVerified: true,
    });

    await adminUser.save();

    // Create wallet for admin
    await Wallet.create({
      userId: adminUser._id,
      balance: 0,
      winningBalance: 0,
      depositBalance: 0,
      bonusBalance: 0,
      commissionBalance: 0,
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@matkahub.com");
    console.log("Mobile: 8888888888");
    console.log("Password: admin@123");
    console.log("Role: admin");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

// Run the script if called directly
createAdminUser();

export default createAdminUser;
