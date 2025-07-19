import connectDB from "../config/database";
import PaymentRequest from "../models/PaymentRequest";

async function updatePlaceholderUrls() {
  try {
    await connectDB();
    console.log("🔗 Connected to MongoDB...");

    // Find all payment requests with placeholder URLs that should now be SVG
    const requests = await PaymentRequest.find({
      paymentProofUrl: { $exists: true, $ne: null },
    });

    console.log(`📋 Checking ${requests.length} payment requests...`);
    console.log("🔄 Updating URLs from incorrect extensions to SVG...");
    console.log("━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let updatedCount = 0;

    for (const request of requests) {
      const oldUrl = request.paymentProofUrl;

      if (oldUrl && oldUrl.startsWith("/api/uploads/")) {
        // Check if this URL points to a file that no longer exists (because we deleted the wrong extension files)
        // and update it to point to the SVG version
        const shouldBeSvg = /\.(jpeg|jpg|png|gif)$/i.test(oldUrl);

        if (shouldBeSvg) {
          const svgUrl = oldUrl.replace(/\.(jpeg|jpg|png|gif)$/i, ".svg");

          await PaymentRequest.findByIdAndUpdate(request._id, {
            paymentProofUrl: svgUrl,
          });

          console.log(`✅ Updated: ${oldUrl} → ${svgUrl}`);
          updatedCount++;
        }
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎯 Updated ${updatedCount} database URLs`);

    if (updatedCount === 0) {
      console.log("💡 No URLs needed updating");
    } else {
      console.log("✅ All URLs now point to correct SVG placeholder files");
      console.log(
        "🎨 SVG placeholders will display properly in the admin panel",
      );
    }
  } catch (error) {
    console.error("❌ Error updating placeholder URLs:", error);
  } finally {
    process.exit(0);
  }
}

updatePlaceholderUrls();
