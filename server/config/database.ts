import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb+srv://sachintakroia:Sachin123@cluster5.4ihtya2.mongodb.net/matka-hub";

    await mongoose.connect(mongoURI);
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("⚠️  Server running without database connection");
    console.log("💡 To fix: Add your current IP to MongoDB Atlas whitelist");
  }
};

export default connectDB;
