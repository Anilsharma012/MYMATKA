import express from "express";
import GameTimingService, {
  MATKA_GAMES_TIMING,
} from "../services/gameTimingService";

const router = express.Router();

/**
 * @route GET /api/game-status
 * @desc Get current status of all matka games
 * @access Public
 */
router.get("/", (req, res) => {
  try {
    const gamesWithStatus = GameTimingService.getAllGamesStatus();

    res.json({
      success: true,
      data: {
        games: gamesWithStatus,
        totalGames: gamesWithStatus.length,
        openGames: gamesWithStatus.filter((g) => g.status === "open").length,
        closedGames: gamesWithStatus.filter((g) => g.status === "closed")
          .length,
        pendingResults: gamesWithStatus.filter(
          (g) => g.status === "result_declared",
        ).length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting game status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get game status",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/game-status/:gameName
 * @desc Get current status of a specific game
 * @access Public
 */
router.get("/:gameName", (req, res) => {
  try {
    const { gameName } = req.params;
    const gameTiming = GameTimingService.getGameTiming(gameName);

    if (!gameTiming) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    const gameStatus = GameTimingService.getGameStatus(gameTiming);

    res.json({
      success: true,
      data: {
        ...gameTiming,
        ...gameStatus,
        nextResultTime: GameTimingService.getNextResultTime(gameTiming),
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting game status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get game status",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/game-status/admin/pending-results
 * @desc Get games that need result declaration (Admin only)
 * @access Admin
 */
router.get("/admin/pending-results", (req, res) => {
  try {
    const pendingGames = GameTimingService.getGamesNeedingResults();

    res.json({
      success: true,
      data: {
        pendingGames: pendingGames.map((game) => ({
          ...game,
          ...GameTimingService.getGameStatus(game),
          nextResultTime: GameTimingService.getNextResultTime(game),
        })),
        totalPending: pendingGames.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting pending results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending results",
      error: error.message,
    });
  }
});

export default router;
