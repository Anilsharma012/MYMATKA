import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import connectDB from "../config/database";

dotenv.config();

const generateReferralCode = (name: string, id: string): string => {
  const cleanName = name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const shortId = id.slice(-4);
  return `${cleanName}${shortId}`;
};

async function generateReferralCodes() {
  try {
    await connectDB();
    console.log("🚀 Generating referral codes for existing users...");

    // Find users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: "" },
      ],
    });

    console.log(
      `📊 Found ${usersWithoutCodes.length} users without referral codes`,
    );

    let updatedCount = 0;
    for (const user of usersWithoutCodes) {
      const referralCode = generateReferralCode(
        user.fullName,
        user._id.toString(),
      );

      // Check if code already exists (very unlikely but safety check)
      const existingCode = await User.findOne({ referralCode });
      if (!existingCode) {
        user.referralCode = referralCode;
        await user.save();
        updatedCount++;
        console.log(`✅ Generated code ${referralCode} for ${user.fullName}`);
      } else {
        console.log(`⚠️ Code collision for ${user.fullName}, skipping...`);
      }
    }

    console.log(`🎉 Successfully generated ${updatedCount} referral codes!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating referral codes:", error);
    process.exit(1);
  }
}

generateReferralCodes();
