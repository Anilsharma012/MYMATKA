import connectDB from "../config/database";
import PaymentRequest from "../models/PaymentRequest";
import User from "../models/User"; // Need to import to register schema

async function checkPaymentProofs() {
  try {
    await connectDB();
    console.log("🔗 Connected to MongoDB...");

    // Get all payment requests with payment proofs
    const requests = await PaymentRequest.find({
      paymentProofUrl: { $exists: true, $ne: null },
    });

    console.log(
      `📋 Found ${requests.length} payment requests with proof URLs:`,
    );
    console.log("━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    requests.forEach((request, index) => {
      console.log(`${index + 1}. Request ID: ${request._id}`);
      console.log(`   Amount: ₹${request.amount}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Proof URL: ${request.paymentProofUrl}`);
      console.log(`   Created: ${request.createdAt}`);
      console.log("   ─────────────────────────────────────────────────");
    });

    if (requests.length === 0) {
      console.log("💡 No payment requests with proof URLs found.");
      console.log(
        "💡 This is expected if no users have uploaded payment proofs yet.",
      );
    }
  } catch (error) {
    console.error("❌ Error checking payment proofs:", error);
  } finally {
    process.exit(0);
  }
}

checkPaymentProofs();
