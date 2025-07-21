// routes/adminExport.ts
import express from "express";
import { Parser } from "json2csv";

import Bet from "../models/Bet";
import Game from "../models/Game";
import { adminAuth } from "../middleware/adminAuth";

const router = express.Router();

router.get("/games/dropdown", adminAuth, async (req, res) => {
  try {
    console.log("💡 Dropdown called");
    const games = await Game.find({}, "_id name").sort({ name: 1 });
    res.json({ success: true, data: games });
  } catch (err) {
    console.error("❌ Error in dropdown:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/export-bets", adminAuth, async (req, res) => {
  try {
    const { gameId, startTime, endTime } = req.query;

    console.log("🔍 Params:", { gameId, startTime, endTime });

    if (!gameId || !startTime || !endTime) {
      console.log("❌ Missing filters");
      return res.status(400).json({ success: false, message: "Missing filters" });
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    const bets = await Bet.find({
      gameId,
      betPlacedAt: { $gte: start, $lte: end },
    }).populate("userId", "fullName mobile");

    console.log("✅ Bets found:", bets.length);

    const formatted = bets.map(bet => ({
      User: (bet.userId as any)?.fullName || "",
      Mobile: (bet.userId as any)?.mobile || "",
      Game: bet.gameName,
      Type: bet.betType,
      Number: bet.betNumber,
      Amount: bet.betAmount,
      PotentialWin: bet.potentialWinning,
      Status: bet.status,
      PlacedAt: new Date(bet.betPlacedAt).toLocaleString("en-IN"),
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("bets_export.csv");
    return res.send(csv);
  } catch (err) {
    console.error("❌ Export failed:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
