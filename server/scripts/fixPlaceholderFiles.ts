import fs from "fs";
import path from "path";

function fixPlaceholderFiles() {
  const uploadsDir = path.join(__dirname, "../../uploads");

  // Get all files in uploads directory
  const files = fs.readdirSync(uploadsDir);
  console.log("🔧 Fixing placeholder files with wrong content types...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let fixedCount = 0;

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);

    // Only check non-SVG files (jpeg, png, gif, etc.)
    if (!filename.endsWith(".svg")) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        // Check if the file contains SVG content but has a different extension
        if (
          content.includes("<svg") &&
          content.includes('xmlns="http://www.w3.org/2000/svg"')
        ) {
          console.log(`🔍 Found SVG content in ${filename}`);

          // Delete the file with wrong extension
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted incorrect file: ${filename}`);

          // The correct .svg version should already exist
          const svgFilename = filename.replace(
            /\.(jpeg|jpg|png|gif)$/i,
            ".svg",
          );
          const svgPath = path.join(uploadsDir, svgFilename);

          if (fs.existsSync(svgPath)) {
            console.log(`✅ Correct SVG file exists: ${svgFilename}`);
          } else {
            // Create the correct SVG file
            fs.writeFileSync(svgPath, content);
            console.log(`✅ Created correct SVG file: ${svgFilename}`);
          }

          fixedCount++;
        }
      } catch (error) {
        // File might be binary, skip it
        console.log(`⏭️  Skipped binary file: ${filename}`);
      }
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🎯 Fixed ${fixedCount} placeholder files`);

  if (fixedCount === 0) {
    console.log("💡 No placeholder files with wrong extensions found");
  } else {
    console.log("✅ All placeholder files now have correct extensions");
    console.log("💡 Users should re-upload their actual payment proofs");
  }
}

fixPlaceholderFiles();
