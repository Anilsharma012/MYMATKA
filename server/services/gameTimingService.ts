/**
 * 🕘 Game Timing Service
 * Handles all timing logic for matka games with specific close and result times
 */

export interface GameTiming {
  name: string;
  startTime: string; // "08:00"
  endTime: string; // "14:40"
  resultTime: string; // "15:15"
  timezone: string;
}

export const MATKA_GAMES_TIMING: GameTiming[] = [
  {
    name: "Delhi Bazar",
    startTime: "08:00", // 8:00 AM
    endTime: "14:40", // 2:40 PM
    resultTime: "15:15", // 3:15 PM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Goa Market",
    startTime: "08:00", // 8:00 AM
    endTime: "16:10", // 4:10 PM
    resultTime: "16:30", // 4:30 PM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Shri Ganesh",
    startTime: "08:00", // 8:00 AM
    endTime: "16:15", // 4:15 PM
    resultTime: "16:50", // 4:50 PM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Faridabad",
    startTime: "08:00", // 8:00 AM
    endTime: "17:45", // 5:45 PM
    resultTime: "18:30", // 6:30 PM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Ghaziabad",
    startTime: "08:00", // 8:00 AM
    endTime: "20:45", // 8:45 PM
    resultTime: "21:30", // 9:30 PM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Gali",
    startTime: "08:00", // 8:00 AM
    endTime: "23:10", // 11:10 PM
    resultTime: "00:30", // 12:30 AM (Next Day)
    timezone: "Asia/Kolkata",
  },
  {
    name: "Disawer",
    startTime: "08:00", // 8:00 AM
    endTime: "03:30", // 3:30 AM (Night)
    resultTime: "06:00", // 6:00 AM (Next Day)
    timezone: "Asia/Kolkata",
  },
];

export type GameStatus = "waiting" | "open" | "closed" | "result_declared";

export interface GameStatusInfo {
  status: GameStatus;
  timeRemaining?: string;
  nextPhaseTime?: Date;
  message?: string;
}

class GameTimingService {
  /**
   * Get current status of a game based on its timing
   */
  static getGameStatus(gameTiming: GameTiming): GameStatusInfo {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse game times
    const [startHour, startMinute] = gameTiming.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = gameTiming.endTime.split(":").map(Number);
    const [resultHour, resultMinute] = gameTiming.resultTime
      .split(":")
      .map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    let endTimeInMinutes = endHour * 60 + endMinute;
    let resultTimeInMinutes = resultHour * 60 + resultMinute;

    // Handle next day times (for games that close after midnight)
    if (endTimeInMinutes < startTimeInMinutes) {
      endTimeInMinutes += 24 * 60; // Add 24 hours
    }
    if (resultTimeInMinutes < endTimeInMinutes) {
      resultTimeInMinutes += 24 * 60; // Add 24 hours
    }

    // Determine current status
    if (
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes < endTimeInMinutes
    ) {
      // Game is open for betting
      const remainingMinutes = endTimeInMinutes - currentTimeInMinutes;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;

      return {
        status: "open",
        timeRemaining: `${hours}h ${minutes}m to close`,
        message: "Betting is open",
      };
    } else if (
      currentTimeInMinutes >= endTimeInMinutes &&
      currentTimeInMinutes < resultTimeInMinutes
    ) {
      // Game is closed, waiting for result
      const remainingMinutes = resultTimeInMinutes - currentTimeInMinutes;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;

      return {
        status: "closed",
        timeRemaining: `Result in ${hours}h ${minutes}m`,
        message: "Betting closed, awaiting result",
      };
    } else if (currentTimeInMinutes >= resultTimeInMinutes) {
      // Result time has passed
      return {
        status: "result_declared",
        message: "Result should be declared",
      };
    } else {
      // Game is waiting to start
      const remainingMinutes = startTimeInMinutes - currentTimeInMinutes;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;

      return {
        status: "waiting",
        timeRemaining: `Opens in ${hours}h ${minutes}m`,
        message: "Waiting to start",
      };
    }
  }

  /**
   * Get next result declaration time for a game
   */
  static getNextResultTime(gameTiming: GameTiming): Date {
    const now = new Date();
    const [resultHour, resultMinute] = gameTiming.resultTime
      .split(":")
      .map(Number);

    const resultTime = new Date(now);
    resultTime.setHours(resultHour, resultMinute, 0, 0);

    // If result time has passed today, move to next day
    if (resultTime <= now) {
      resultTime.setDate(resultTime.getDate() + 1);
    }

    return resultTime;
  }

  /**
   * Check if result should be declared automatically
   */
  static shouldDeclareResult(gameTiming: GameTiming): boolean {
    const now = new Date();
    const nextResultTime = this.getNextResultTime(gameTiming);

    // Check if we're past the result time
    return now >= nextResultTime;
  }

  /**
   * Get all games with their current status
   */
  static getAllGamesStatus(): Array<GameTiming & GameStatusInfo> {
    return MATKA_GAMES_TIMING.map((game) => ({
      ...game,
      ...this.getGameStatus(game),
    }));
  }

  /**
   * Get games that need result declaration
   */
  static getGamesNeedingResults(): GameTiming[] {
    return MATKA_GAMES_TIMING.filter((game) => this.shouldDeclareResult(game));
  }

  /**
   * Format time remaining in human readable format
   */
  static formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return "Now";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Get game timing by name
   */
  static getGameTiming(gameName: string): GameTiming | null {
    return (
      MATKA_GAMES_TIMING.find(
        (game) => game.name.toLowerCase() === gameName.toLowerCase(),
      ) || null
    );
  }
}

export default GameTimingService;
