import fs from "fs";
import path from "path";
import connectDB from "../config/database";
import PaymentRequest from "../models/PaymentRequest";

async function sanitizeFilenames() {
  try {
    await connectDB();
    console.log("🔗 Connected to MongoDB...");

    const uploadsDir = path.join(__dirname, "../../uploads");

    // Get all files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in uploads directory`);

    let renamedCount = 0;
    const fileMapping: { old: string; new: string }[] = [];

    for (const filename of files) {
      // Check if filename has spaces or special characters that need sanitizing
      if (/[\s()&]/.test(filename)) {
        const sanitizedName = filename
          .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
          .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

        const oldPath = path.join(uploadsDir, filename);
        const newPath = path.join(uploadsDir, sanitizedName);

        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Renamed: ${filename} → ${sanitizedName}`);
          fileMapping.push({ old: filename, new: sanitizedName });
          renamedCount++;
        } catch (error) {
          console.error(`❌ Failed to rename ${filename}:`, error);
        }
      }
    }

    // Update database URLs
    console.log("🔄 Updating database URLs...");
    let dbUpdatesCount = 0;

    for (const mapping of fileMapping) {
      const oldUrl = `/api/uploads/${mapping.old}`;
      const newUrl = `/api/uploads/${mapping.new}`;

      const result = await PaymentRequest.updateMany(
        { paymentProofUrl: oldUrl },
        { paymentProofUrl: newUrl },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `📝 Updated ${result.modifiedCount} database record(s): ${oldUrl} → ${newUrl}`,
        );
        dbUpdatesCount += result.modifiedCount;
      }
    }

    console.log("━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎯 Sanitization complete!`);
    console.log(`📁 Files renamed: ${renamedCount}`);
    console.log(`📝 Database records updated: ${dbUpdatesCount}`);

    if (renamedCount === 0) {
      console.log("💡 No files needed sanitizing - all filenames are clean");
    }
  } catch (error) {
    console.error("❌ Error sanitizing filenames:", error);
  } finally {
    process.exit(0);
  }
}

sanitizeFilenames();
