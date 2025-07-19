import connectDB from "../config/database";
import PaymentRequest from "../models/PaymentRequest";

async function fixPaymentProofUrls() {
  try {
    await connectDB();
    console.log("🔗 Connected to MongoDB...");

    // Get all payment requests with payment proofs
    const requests = await PaymentRequest.find({
      paymentProofUrl: { $exists: true, $ne: null },
    });

    console.log(`📋 Found ${requests.length} payment requests with proof URLs`);
    console.log("🔧 Fixing URLs to use local server...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let fixedCount = 0;

    for (const request of requests) {
      const oldUrl = request.paymentProofUrl;

      if (oldUrl && oldUrl.includes("cdn.matkahub.com")) {
        // Extract filename from the URL
        const filename = oldUrl.split("/").pop();

        if (filename) {
          // Update to local server URL
          const newUrl = `/api/uploads/${filename}`;

          await PaymentRequest.findByIdAndUpdate(request._id, {
            paymentProofUrl: newUrl,
          });

          console.log(`✅ Fixed: ${oldUrl} → ${newUrl}`);
          fixedCount++;
        }
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎯 Fixed ${fixedCount} payment proof URLs`);

    if (fixedCount === 0) {
      console.log("💡 No URLs needed fixing - they might already be correct");
    } else {
      console.log("✅ All payment proof URLs now point to local server");
      console.log(
        "💡 Note: You'll need to manually place the actual image files in the uploads/ directory",
      );
      console.log("💡 Or users will need to re-upload their payment proofs");
    }
  } catch (error) {
    console.error("❌ Error fixing payment proof URLs:", error);
  } finally {
    process.exit(0);
  }
}

fixPaymentProofUrls();
