import fs from "fs";
import path from "path";

function createPlaceholderImages() {
  const uploadsDir = path.join(__dirname, "../../uploads");

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a simple placeholder SVG image for testing
  const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#2a2a2a"/>
  <text x="200" y="140" font-family="Arial" font-size="16" fill="#ffffff" text-anchor="middle">Payment Proof</text>
  <text x="200" y="170" font-family="Arial" font-size="14" fill="#aaaaaa" text-anchor="middle">Placeholder Image</text>
  <text x="200" y="190" font-family="Arial" font-size="12" fill="#888888" text-anchor="middle">Original file not available</text>
</svg>`;

  // List of files we need placeholders for
  const filenames = [
    "1751626184993_WhatsApp Image 2025-07-03 at 12.48.33 PM.jpeg",
    "1751626540924_WhatsApp Image 2025-07-03 at 12.48.32 PM (2).jpeg",
    "1751785929171_AboutTwo - Copy.png",
    "1751896561565_07.jpeg",
    "1752060441083_bg.jpg",
    "1752072247096_Screenshot_20250628-114010.png",
    "1752139897412_WhatsApp Image 2025-07-08 at 6.52.47 PM.jpeg",
    "1752223427916_grid.gif",
    "1752235311172_WhatsApp Image 2025-07-11 at 4.01.46 PM.jpeg",
    "1752311189057_WhatsApp Image 2025-07-11 at 3.16.37 PM.jpeg",
  ];

  console.log("🖼️ Creating placeholder images for payment proofs...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  filenames.forEach((filename) => {
    const filePath = path.join(uploadsDir, filename);
    const ext = path.extname(filename).toLowerCase();

    if (!fs.existsSync(filePath)) {
      if (ext === ".svg") {
        // Write SVG directly
        fs.writeFileSync(filePath, placeholderSvg);
      } else {
        // For other formats, create an SVG file with the same name
        const svgPath = filePath.replace(ext, ".svg");
        fs.writeFileSync(svgPath, placeholderSvg);
        console.log(`📝 Created SVG placeholder: ${path.basename(svgPath)}`);

        // Also create the original file as SVG (browsers can display SVG as any image type)
        fs.writeFileSync(filePath, placeholderSvg);
      }
      console.log(`✅ Created placeholder: ${filename}`);
    } else {
      console.log(`⏭️  File already exists: ${filename}`);
    }
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 Placeholder images created successfully!");
  console.log(
    "💡 These are SVG placeholders - real users should re-upload their payment proofs",
  );
}

createPlaceholderImages();
