import mongoose from "mongoose";
import User from "../models/User";

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb+srv://sachintakroia:Sachin123@cluster5.4ihtya2.mongodb.net/matka-hub";

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ mobile: "8888888888" });

    if (adminUser) {
      console.log("Found admin user:", adminUser.fullName, adminUser.email);
      
      // Update password
      adminUser.password = "admin@123";
      adminUser.role = "superadmin"; // Upgrade to superadmin
      adminUser.isActive = true;
      adminUser.isVerified = true;
      
      await adminUser.save();
      
      console.log("✅ Admin password updated successfully!");
      console.log("Mobile: 8888888888");
      console.log("Password: admin@123");
      console.log("Role: superadmin");
    } else {
      console.log("❌ Admin user not found. Creating new admin...");
      
      // Create new admin
      const newAdmin = new User({
        fullName: "Super Admin",
        email: "admin@matkahub.com",
        mobile: "8888888888",
        password: "admin@123",
        role: "superadmin",
        isActive: true,
        isVerified: true,
      });

      await newAdmin.save();
      console.log("✅ New admin created successfully!");
      console.log("Mobile: 8888888888");
      console.log("Password: admin@123");
      console.log("Role: superadmin");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating admin:", error);
    process.exit(1);
  }
};

updateAdminPassword();
