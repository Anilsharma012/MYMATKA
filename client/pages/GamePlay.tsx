import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import BASE_URL from "../src/config";
import { useToast } from "@/hooks/use-toast";
import { safeParseResponse } from "@/lib/responseUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Wallet,
  TrendingUp,
  AlertCircle,
  Play,
  Star,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface Game {
  _id: string;
  name: string;
  type: "jodi" | "haruf" | "crossing";
  description: string;
  startTime: string;
  endTime: string;
  resultTime: string;
  minBet: number;
  maxBet: number;
  jodiPayout: number;
  harufPayout: number;
  crossingPayout: number;
  currentStatus: "waiting" | "open" | "closed" | "result_declared";
}

interface Wallet {
  depositBalance: number;
  winningBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

const GamePlay = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mountedRef = useRef(true);

  const [game, setGame] = useState<Game | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState<
    "jodi" | "haruf" | "crossing"
  >("jodi");

  // Bet form state
  const [betData, setBetData] = useState({
  betNumber: "",
  betAmount: "",
  harufPosition: "first" as "first" | "last",
  crossingCombination: "",
  crossingNumbers: "",
  crossingAmount: "",
  jodaCut: false,
  generatedCrossings: [] as {
    number: string;
    amount: number;
    type?: "crossing" | "joda_cut";
  }[],
  allCrossings: [] as { number: string; amount: number; type: "crossing" }[],
  jodaCutCrossings: [] as {
    number: string;
    amount: number;
    type: "joda_cut";
  }[],
  crossingTotal: 0,
  jodaCutTotal: 0,

  // ✅ Add this line for Haruf inputs
  harufBets: {} as Record<string, number>,
});


  // Hot numbers and trending bets (mock data)
  const [hotNumbers, setHotNumbers] = useState({
    jodi: ["12", "34", "56", "78"],
    haruf: ["1", "3", "5", "7"],
    crossing: ["12-34", "56-78"],
  });

  // Generate crossing combinations exactly like screenshot
  // 🔸 Enhanced Crossing & Joda Cut Bet Generator - Supports 2-4 digit inputs
  const generateCrossingCombinations = (
    inputNumber: string,
    amount: number,
  ) => {
    if (
      !inputNumber ||
      inputNumber.length < 2 ||
      inputNumber.length > 4 ||
      !amount ||
      amount <= 0
    ) {
      setBetData((prev) => ({
        ...prev,
        generatedCrossings: [],
        allCrossings: [],
        jodaCutCrossings: [],
        crossingTotal: 0,
        jodaCutTotal: 0,
      }));
      return;
    }

    const digits = inputNumber.split("");
    const allCombinations = new Set<string>();

    // 🔄 Generate all possible 2-digit combinations from input digits
    for (let i = 0; i < digits.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        // Create all pairs including same digit pairs (joda)
        const combination = digits[i] + digits[j];
        allCombinations.add(combination);
      }
    }

    // Convert to array and create crossing bets
    const crossingBets = Array.from(allCombinations)
      .sort() // Sort for consistent display
      .map((combo) => ({
        number: combo,
        amount: amount,
        type: "crossing" as const,
      }));

    // ✂️ Apply Joda Cut Logic - Remove double digits (22, 33, 55, etc.)
    const jodaCutBets = crossingBets
      .filter((bet) => {
        const [first, second] = bet.number.split("");
        return first !== second; // Remove joda numbers (same digits)
      })
      .map((bet) => ({
        ...bet,
        type: "joda_cut" as const,
      }));

    // Calculate totals
    const crossingTotal = crossingBets.length * amount;
    const jodaCutTotal = jodaCutBets.length * amount;

    // Update state with both crossing and joda cut data
    setBetData((prev) => ({
      ...prev,
      generatedCrossings: prev.jodaCut ? jodaCutBets : crossingBets,
      allCrossings: crossingBets,
      jodaCutCrossings: jodaCutBets,
      crossingTotal: crossingTotal,
      jodaCutTotal: jodaCutTotal,
    }));

    // 🧾 Log the generation for admin tracking
    console.log(
      `🎯 Generated from "${inputNumber}" (${digits.length} digits):`,
      {
        input: inputNumber,
        inputLength: digits.length,
        totalCrossings: crossingBets.length,
        crossingTotal: `₹${crossingTotal}`,
        jodaCutCount: jodaCutBets.length,
        jodaCutTotal: `₹${jodaCutTotal}`,
        crossingNumbers: crossingBets.map((b) => b.number).join(", "),
        jodaCutNumbers: jodaCutBets.map((b) => b.number).join(", "),
      },
    );
  };

  useEffect(() => {
    console.log(
      "🔍 GamePlay useEffect - fetching real data from MongoDB Atlas...",
    );
    console.log("User:", user);
    console.log("GameId:", gameId);

    const token = localStorage.getItem("matka_token");
    console.log("Token:", token ? "Present" : "Missing");

    if (!gameId) {
      console.log("❌ No gameId found, redirecting to games");
      navigate("/games");
      return;
    }

    if (!user && !token) {
      console.log("❌ No user or token, redirecting to login");
      navigate("/login");
      return;
    }

    console.log(
      "��� Auth check passed, fetching real data from MongoDB Atlas...",
    );

    // Track if component is still mounted
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchGameData();
        if (isMounted) {
          await fetchWalletData();
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
      mountedRef.current = false;
    };
  }, [user, gameId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (game && mountedRef.current) {
        updateCountdown();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game]);

  const fetchGameData = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        console.log("❌ No auth token found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log(
        "🔄 Fetching REAL game data from MongoDB Atlas for gameId:",
        gameId,
      );

      // Use a wrapped fetch to handle network errors gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ Request timeout after 10 seconds");
        controller.abort();
      }, 10000);

      const response = await fetch(`${BASE_URL}/api/games/${gameId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }).catch((error) => {
        // Handle different types of errors
        if (error.name === "AbortError") {
          console.log(
            "🔌 Request was aborted (component unmounted or timeout)",
          );
          return null;
        }
        console.log("🔌 Network connectivity issue detected:", error.message);
        return null;
      });

      clearTimeout(timeoutId);

      if (response && response.ok && mountedRef.current) {
        try {
          const data = await safeParseResponse(response);
          if (!data.error) {
            console.log("✅ REAL Game data from MongoDB:", data.data);
            console.log("🎯 Current payout rates from MongoDB:", {
              jodi: data.data.jodiPayout,
              haruf: data.data.harufPayout,
              crossing: data.data.crossingPayout,
            });

            setGame(data.data);

            toast({
              title: "✅ Real Data Loaded",
              description: `Game data fetched from MongoDB Atlas. Payout rates: Jodi ${data.data.jodiPayout}:1, Haruf ${data.data.harufPayout}:1, Crossing ${data.data.crossingPayout}:1`,
              className: "border-green-500 bg-green-50 text-green-900",
            });
          } else {
            console.log("⚠️ Game fetch - non-JSON response received");
          }
        } catch (jsonError) {
          console.error("❌ Failed to parse game response JSON:", jsonError);
        }
      } else if (response && response.status === 401) {
        console.log("Authentication failed, redirecting to login");
        localStorage.removeItem("matka_token");
        localStorage.removeItem("matka_user");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again to continue.",
        });
        navigate("/login");
      } else if (response && response.status === 404) {
        console.log("Game not found, redirecting to games list");
        toast({
          variant: "destructive",
          title: "Game Not Found",
          description: "The requested game could not be found.",
        });
        navigate("/games");
      } else if (!response) {
        // No response means network/server connectivity issue
        console.log(
          "🔌 Server connectivity issue - backend may be starting up",
        );
        toast({
          title: "⚠️ Server Connectivity",
          description:
            "Connecting to MongoDB Atlas... Please wait or refresh the page.",
          className: "border-yellow-500 bg-yellow-50 text-yellow-900",
        });
      } else {
        console.error(
          "Failed to fetch game data:",
          response?.status || "Unknown",
        );
        toast({
          variant: "destructive",
          title: "Server Error",
          description: "Failed to load game data. Please refresh the page.",
        });
      }
    } catch (error: any) {
      // Handle different types of errors gracefully
      if (error.name === "AbortError") {
        console.log(
          "🔌 Game fetch was aborted (component unmounted or timeout)",
        );
        return;
      }
      console.log("🔌 Game fetch error handled gracefully:", error.message);
      toast({
        title: "⚠️ Connection Issue",
        description:
          "Having trouble connecting to the server. Please refresh the page.",
        className: "border-yellow-500 bg-yellow-50 text-yellow-900",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        console.log("❌ No auth token for wallet fetch");
        return;
      }

      console.log("🔄 Fetching REAL wallet data from MongoDB Atlas...");

      // Use a wrapped fetch to handle network errors gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ Wallet request timeout after 8 seconds");
        controller.abort();
      }, 8000);

      const response = await fetch(`${BASE_URL}/api/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }).catch((error) => {
        // Handle different types of errors
        if (error.name === "AbortError") {
          console.log(
            "🔌 Wallet request was aborted (component unmounted or timeout)",
          );
          return null;
        }
        console.log("🔌 Wallet fetch connectivity issue:", error.message);
        return null;
      });

      clearTimeout(timeoutId);

      if (response && response.ok && mountedRef.current) {
        try {
          const data = await safeParseResponse(response);
          if (!data.error) {
            console.log("��� REAL Wallet data from MongoDB:", data.data);
            setWallet(data.data);
          } else {
            console.log("⚠️ Wallet fetch - non-JSON response received");
          }
        } catch (jsonError) {
          console.error("❌ Failed to parse wallet response JSON:", jsonError);
        }
      } else if (!response) {
        console.log("🔌 Wallet fetch - server connectivity issue");
      } else {
        console.log("⚠️ Wallet fetch failed:", response.status);
      }
    } catch (error: any) {
      // Handle different types of errors gracefully
      if (error.name === "AbortError") {
        console.log(
          "🔌 Wallet fetch was aborted (component unmounted or timeout)",
        );
        return;
      }
      console.log("🔌 Wallet fetch error handled gracefully:", error.message);
    }
  };

  const updateCountdown = () => {
    if (!game) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    let targetTime = "";
    if (game.currentStatus === "open") {
      targetTime = game.endTime;
    } else if (game.currentStatus === "closed") {
      targetTime = game.resultTime;
    } else if (game.currentStatus === "waiting") {
      targetTime = game.startTime;
    }

    if (targetTime) {
      const [hours, minutes] = targetTime.split(":").map(Number);
      const [currentHours, currentMinutes] = currentTime.split(":").map(Number);

      const targetMinutes = hours * 60 + minutes;
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      let diffMinutes = targetMinutes - currentTotalMinutes;
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Next day

      const remainingHours = Math.floor(diffMinutes / 60);
      const remainingMins = diffMinutes % 60;

      setCountdown({
        hours: remainingHours,
        minutes: remainingMins,
        seconds: 59 - now.getSeconds(),
      });
    }
  };

  const handleNumberSelect = (number: string) => {
    setBetData((prev) => ({ ...prev, betNumber: number }));
    setShowBetModal(true);
  };

  const handlePlaceBet = async () => {
    if (!betData.betNumber || !betData.betAmount) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please select a number and enter bet amount.",
      });
      return;
    }

    if (parseFloat(betData.betAmount) < game!.minBet) {
      toast({
        variant: "destructive",
        title: "Minimum Bet",
        description: `Minimum bet amount is ₹${game!.minBet}`,
      });
      return;
    }

    if (parseFloat(betData.betAmount) > game!.maxBet) {
      toast({
        variant: "destructive",
        title: "Maximum Bet",
        description: `Maximum bet amount is ₹${game!.maxBet}`,
      });
      return;
    }

    setPlacing(true);

    const betPayload = {
      gameId: game!._id,
      betType: selectedBetType,
      betNumber: betData.betNumber,
      betAmount: parseFloat(betData.betAmount),
      harufPosition:
        selectedBetType === "haruf" ? betData.harufPosition : undefined,
    };

    try {
      const token = localStorage.getItem("matka_token");

      console.log("🎯 Placing REAL bet in MongoDB:", betPayload);

      const response = await fetch(`${BASE_URL}/api/games/place-bet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(betPayload),
      });

      // Handle response safely to avoid body reuse errors
      console.log("🔍 Response details:", {
        status: response.status,
        statusText: response.statusText,
        bodyUsed: response.bodyUsed,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await safeParseResponse(response);

      // Check if response parsing failed
      if (data.error) {
        console.error("❌ Response parsing failed:", data.message);
        throw new Error(data.message);
      }

      if (response.ok) {
        console.log("✅ REAL bet placed in MongoDB:", data);

        toast({
          title: "✅ Bet Placed Successfully!",
          description: `₹${betData.betAmount} bet placed on ${selectedBetType.toUpperCase()} - ${betData.betNumber}. Saved to MongoDB Atlas!`,
          className: "border-green-500 bg-green-50 text-green-900",
        });

        // Update wallet balance immediately
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                depositBalance:
                  data?.data?.currentBalance || prev.depositBalance,
              }
            : null,
        );

        // Close modal and reset form
        setShowBetModal(false);
        setBetData({
          betNumber: "",
          betAmount: "",
          harufPosition: "first",
          crossingCombination: "",
          crossingNumbers: "",
          crossingAmount: "",
          jodaCut: false,
          generatedCrossings: [],
          allCrossings: [],
          jodaCutCrossings: [],
          crossingTotal: 0,
          jodaCutTotal: 0,
        });

        // Refresh wallet data
        await fetchWalletData();
      } else {
        const errorMessage = data?.message || "Failed to place bet";

        if (errorMessage.includes("Insufficient")) {
          toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: `Add money to your wallet. ${errorMessage}`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/add-money")}
              >
                Add Money
              </Button>
            ),
          });
        } else {
          toast({
            variant: "destructive",
            title: "Bet Failed",
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "Failed to connect to server. Please check your internet connection.",
      });
    } finally {
      setPlacing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500";
      case "closed":
        return "bg-yellow-500";
      case "waiting":
        return "bg-blue-500";
      case "result_declared":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Betting Open";
      case "closed":
        return "Betting Closed";
      case "waiting":
        return "Waiting to Start";
      case "result_declared":
        return "Result Declared";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-matka-gold border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-matka-gold">
                Loading real game data from MongoDB Atlas...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-matka-dark text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Game Not Available
              </h2>
              <p className="text-muted-foreground mb-4">
                Unable to load game data from MongoDB Atlas.
              </p>
              <Button
                onClick={() => navigate("/games")}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                Back to Games
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matka-dark text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/games")}
              className="border-matka-gold text-matka-gold hover:bg-matka-gold/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-matka-gold">
                {game.name}
              </h1>
              <p className="text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`${getStatusColor(game.currentStatus)} text-white`}
            >
              {getStatusText(game.currentStatus)}
            </Badge>
            <Badge className="bg-blue-500 text-white">Real Database</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Info & Timer */}
          {/* <div className="lg:col-span-1 space-y-6"> */}
            {/* Wallet Balance */}
            {/* <Card className="bg-card/90 backdrop-blur-sm border-border/50"> */}
              {/* <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Balance (Real Data)
                </CardTitle>
              </CardHeader> */}



              {/* <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-matka-gold">
                    ���{wallet?.depositBalance.toLocaleString() || 0}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Available for betting (From MongoDB)
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/add-money")}
                      className="flex-1 bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                    >
                      Add Money
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        console.log(
                          "🔄 Manually refreshing REAL data from MongoDB...",
                        );
                        await fetchGameData();
                        await fetchWalletData();
                      }}
                      variant="outline"
                      className="border-matka-gold text-matka-gold hover:bg-matka-gold/10"
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              </CardContent> */}
            {/* </Card> */}



            {/* Game Timer */}
            {/* <Card className="bg-card/90 backdrop-blur-sm border-border/50"> */}
              {/* <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Game Timer
                </CardTitle>
              </CardHeader> */}
              {/* <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-matka-gold mb-2">
                    {String(countdown.hours).padStart(2, "0")}:
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {game.currentStatus === "open"
                      ? "Time left to bet"
                      : game.currentStatus === "closed"
                        ? "Result announcement in"
                        : game.currentStatus === "waiting"
                          ? "Game starts in"
                          : "Next game in"}
                  </p>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="text-foreground">{game.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Time:</span>
                    <span className="text-foreground">{game.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Result Time:</span>
                    <span className="text-foreground">{game.resultTime}</span>
                  </div>
                </div>

                
                <div className="mt-4 p-3 bg-matka-gold/10 rounded-lg border border-matka-gold/30">
                  <p className="text-xs font-semibold text-matka-gold mb-2">
                    Real Payout Rates (From MongoDB):
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-400">🎯 Jodi</div>
                      <div className="font-bold text-foreground">
                        {game.jodiPayout}:1
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400">⚡ Haruf</div>
                      <div className="font-bold text-foreground">
                        {game.harufPayout}:1
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400">🏆 Crossing</div>
                      <div className="font-bold text-foreground">
                        {game.crossingPayout}:1
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent> */}
            {/* </Card> */}

            {/* Hot Numbers */}
            {/* <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Hot Numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Jodi
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hotNumbers.jodi.map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBetType("jodi");
                            handleNumberSelect(num);
                          }}
                          className="text-xs border-matka-gold/30 text-matka-gold hover:bg-matka-gold/10"
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Haruf
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hotNumbers.haruf.map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBetType("haruf");
                            handleNumberSelect(num);
                          }}
                          className="text-xs border-matka-gold/30 text-matka-gold hover:bg-matka-gold/10"
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          {/* </div> */}




          {/* Game Play Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Place Your Bet (Real Betting)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedBetType}
                  onValueChange={(value: any) => setSelectedBetType(value)}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger
                      value="jodi"
                      className="flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Jodi ({game.jodiPayout}:1)
                    </TabsTrigger>
                    <TabsTrigger
                      value="haruf"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Haruf ({game.harufPayout}:1)
                    </TabsTrigger>
                    <TabsTrigger
                      value="crossing"
                      className="flex items-center gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Crossing ({game.crossingPayout}:1)
                    </TabsTrigger>
                  </TabsList>

                  {/* Jodi Game */}
                  <TabsContent value="jodi">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">
                          Select 2-Digit Number (00-99)
                        </Label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                          {Array.from({ length: 100 }, (_, i) => {
                            const num = String(i).padStart(2, "0");
                            return (
                              <Button
                                key={num}
                                variant={
                                  betData.betNumber === num
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleNumberSelect(num)}
                                className={`text-xs ${
                                  betData.betNumber === num
                                    ? "bg-matka-gold text-matka-dark"
                                    : "border-border hover:border-matka-gold"
                                }`}
                              >
                                {num}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Haruf Game - Andar/Bahar Style */}
              <TabsContent value="haruf">
  <div className="bg-gray-800 rounded-2xl p-4">
    <div className="grid grid-cols-2 gap-4">
      {/* Andar Game */}
      <div className="space-y-3">
        <h3 className="text-white text-base font-medium text-center mb-3">
          Andar Game
        </h3>
        {Array.from({ length: 10 }, (_, i) => {
          const key = `A${i}`;
          return (
            <div key={key} className="flex gap-2 items-center">
              <div className="w-10 h-9 bg-gray-600 rounded text-white font-medium text-sm flex items-center justify-center">
                {key}
              </div>
              <input
                type="number"
                placeholder="00"
                value={betData.harufBets?.[key] || ""}
                onChange={(e) => {
                  const updated = {
                    ...betData.harufBets,
                    [key]: parseInt(e.target.value || "0"),
                  };
                  setBetData((prev) => ({
                    ...prev,
                    harufBets: updated,
                  }));
                }}
               className="w-full max-w-[100px] sm:max-w-full h-9 bg-gray-600 rounded text-white text-center font-medium text-sm border-none outline-none placeholder-gray-400 focus:bg-gray-500 transition-colors"

                max="5000"
              />
            </div>
          );
        })}
      </div>

      {/* Bahar Game */}
      <div className="space-y-3">
        <h3 className="text-white text-base font-medium text-center mb-3">
          Bahar Game
        </h3>
        {Array.from({ length: 10 }, (_, i) => {
          const key = `B${i}`;
          return (
            <div key={key} className="flex gap-2 items-center">
              <div className="w-10 h-9 bg-gray-600 rounded text-white font-medium text-sm flex items-center justify-center">
                {key}
              </div>
              <input
                type="number"
                placeholder="00"
                value={betData.harufBets?.[key] || ""}
                onChange={(e) => {
                  const updated = {
                    ...betData.harufBets,
                    [key]: parseInt(e.target.value || "0"),
                  };
                  setBetData((prev) => ({
                    ...prev,
                    harufBets: updated,
                  }));
                }}
               className="w-full max-w-[100px] sm:max-w-full h-9 bg-gray-600 rounded text-white text-center font-medium text-sm border-none outline-none placeholder-gray-400 focus:bg-gray-500 transition-colors"

                max="5000"
              />
            </div>
          );
        })}
      </div>
    </div>

    {/* 🟡 Total & Submit */}
    <div className="mt-6 space-y-4">
      <div className="bg-gray-900 p-4 rounded-xl text-white text-lg font-semibold flex justify-between">
        <span>Total Bet Amount</span>
        <span>
          ₹
          {Object.values(betData.harufBets || {}).reduce(
            (sum, val) => sum + (parseInt(val as any) || 0),
            0
          )}
        </span>
      </div>

      <Button
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg py-3 rounded-xl"
        onClick={async () => {
          const entries = Object.entries(betData.harufBets || {}).filter(
            ([_, val]) => val > 0
          );

          if (entries.length === 0) {
            alert("कृपया कम से कम एक Haruf number पर पैसे लगाएं");
            return;
          }

          const token = localStorage.getItem("matka_token");
          if (!token) {
            alert("Login required");
            return;
          }

          setPlacing(true);
          try {
            let totalPlaced = 0;

            for (const [number, amount] of entries) {
              const betPayload = {
                gameId: game!._id,
                betType: "haruf",
                betNumber: number,
                betAmount: amount,
                harufPosition: number.startsWith("A") ? "first" : "last",
              };

              const res = await fetch(`${BASE_URL}/api/games/place-bet`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(betPayload),
              });

              const data = await res.json();
              if (res.ok && !data.error) {
                totalPlaced += amount;
              } else {
                console.warn(`❌ Failed for ${number}:`, data.message);
              }
            }

            if (totalPlaced > 0) {
              toast({
                title: "✅ Bet Placed",
                description: `₹${totalPlaced} placed across ${entries.length} Haruf bets.`,
                className: "border-green-500 bg-green-50 text-green-900",
              });

              await fetchWalletData();

              setBetData((prev) => ({
                ...prev,
                harufBets: {},
                betNumber: "",
                betAmount: "",
              }));
            } else {
              toast({
                variant: "destructive",
                title: "No Bets Placed",
                description: "All bets failed or were invalid.",
              });
            }
          } catch (err) {
            console.error(err);
            toast({
              variant: "destructive",
              title: "Server Error",
              description: "Haruf bets failed.",
            });
          } finally {
            setPlacing(false);
          }
        }}
        disabled={
          Object.values(betData.harufBets || {}).reduce(
            (sum, val) => sum + (parseInt(val as any) || 0),
            0
          ) === 0
        }
      >
        SUBMIT HARUF BET
      </Button>
    </div>
  </div>
</TabsContent>




                  {/* Crossing Game - Exact Screenshot Match */}
                  <TabsContent value="crossing">
                    <div className="max-w-md mx-auto space-y-6">
                      {/* Crossing Input Section */}
                      <div className="bg-gray-800 rounded-3xl p-6 space-y-6">
                        <div>
                          <Label className="text-gray-300 text-lg mb-3 block">
                            Crossing Numbers (2-4 digits)
                          </Label>
                          <Input
                            value={betData.crossingNumbers}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              );
                              setBetData((prev) => ({
                                ...prev,
                                crossingNumbers: value,
                              }));
                              if (
                                value.length >= 2 &&
                                value.length <= 4 &&
                                betData.crossingAmount
                              ) {
                                generateCrossingCombinations(
                                  value,
                                  parseFloat(betData.crossingAmount),
                                );
                              }
                            }}
                            placeholder="23, 235, or 1234"
                            className="bg-gray-600 border-none text-white text-xl py-4 px-4 rounded-2xl placeholder-gray-400 h-16"
                            maxLength={4}
                          />
                          <p className="text-gray-400 text-xs mt-1">
                            📥 Enter 2-4 digit number for dynamic Jodi
                            generation
                          </p>
                        </div>

                        <div>
                          <Label className="text-gray-300 text-lg mb-3 block">
                            Crossing into Amount
                          </Label>
                          <Input
                            value={betData.crossingAmount}
                            onChange={(e) => {
                              setBetData((prev) => ({
                                ...prev,
                                crossingAmount: e.target.value,
                              }));
                              if (
                                betData.crossingNumbers &&
                                betData.crossingNumbers.length >= 2 &&
                                betData.crossingNumbers.length <= 4
                              ) {
                                generateCrossingCombinations(
                                  betData.crossingNumbers,
                                  parseFloat(e.target.value || "0"),
                                );
                              }
                            }}
                            placeholder="10"
                            type="number"
                            className="bg-gray-600 border-none text-white text-xl py-4 px-4 rounded-2xl placeholder-gray-400 h-16"
                            max="5000"
                          />
                          <p className="text-gray-400 text-sm mt-2">
                            * Crossing Amount below 5000
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="joda-cut"
                            checked={betData.jodaCut}
                            onCheckedChange={(checked) => {
                              const newJodaCut = checked as boolean;
                              setBetData((prev) => ({
                                ...prev,
                                jodaCut: newJodaCut,
                                // Switch display between crossing and joda cut
                                generatedCrossings: newJodaCut
                                  ? prev.jodaCutCrossings
                                  : prev.allCrossings,
                              }));

                              // Regenerate if data exists
                              if (
                                betData.crossingNumbers &&
                                betData.crossingAmount
                              ) {
                                generateCrossingCombinations(
                                  betData.crossingNumbers,
                                  parseFloat(betData.crossingAmount),
                                );
                              }
                            }}
                            className="border-gray-400 data-[state=checked]:bg-gray-600 w-5 h-5"
                          />
                          <Label
                            htmlFor="joda-cut"
                            className="text-gray-300 text-lg"
                          >
                            Joda Cut
                          </Label>
                        </div>
                      </div>

                      {/* Save Button */}
                      <Button
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 text-xl rounded-full transition-all duration-300"
                        onClick={() => {
                          if (
                            betData.crossingNumbers &&
                            betData.crossingAmount &&
                            betData.generatedCrossings.length > 0
                          ) {
                            const total = betData.generatedCrossings.reduce(
                              (sum, item) => sum + item.amount,
                              0,
                            );
                            const betType = betData.jodaCut
                              ? "Joda Cut"
                              : "Crossing";
                            alert(
                              `${betType} bet saved! ${betData.generatedCrossings.length} combinations for ₹${total} total`,
                            );
                          } else {
                            alert(
                              "Please enter 2-4 digit crossing number and amount",
                            );
                          }
                        }}
                      >
                        SAVE
                      </Button>

                      {/* Total Number of Crossing */}
                      <div>
                        <div className="text-center mb-6">
                          <h3 className="text-white text-xl font-medium mb-2">
                            {betData.jodaCut
                              ? "🔸 Joda Cut Bets"
                              : "🔄 Crossing Bets"}
                          </h3>
                          {betData.crossingNumbers && (
                            <div className="text-gray-400 text-sm space-y-1">
                              <div>
                                Input: {betData.crossingNumbers} (
                                {betData.crossingNumbers.length} digits)
                              </div>
                              <div className="flex justify-center gap-4">
                                <span>
                                  Crossing: {betData.allCrossings.length} × ₹
                                  {betData.crossingAmount} = ₹
                                  {betData.crossingTotal}
                                </span>
                                <span>
                                  Joda Cut: {betData.jodaCutCrossings.length} ×
                                  ₹{betData.crossingAmount} = ₹
                                  {betData.jodaCutTotal}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="bg-gray-800 rounded-3xl p-6">
                          <div className="flex justify-between items-center text-gray-400 mb-4 pb-3 border-b border-gray-600">
                            <span className="font-medium">No.</span>
                            <span className="font-medium">Value</span>
                          </div>
                          {betData.generatedCrossings.length > 0 ? (
                            betData.generatedCrossings.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-white mb-3 text-lg"
                              >
                                <span className="font-medium">
                                  {item.number}
                                </span>
                                <span className="font-medium">
                                  �� {item.amount}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-400 py-8">
                              📥 Enter 2-4 digit number and amount to see Jodi
                              combinations
                              <div className="text-xs mt-2">
                                Example: 23 → 4 Jodis, 235 → 9 Jodis, 1234 → 16
                                Jodis
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Total and Submit */}
                      <div className="bg-gray-800 rounded-3xl p-6 flex items-center justify-between">
                        <div>
                          <div className="text-gray-400 text-base">
                            Total Amount
                          </div>
                          <div className="text-white text-3xl font-bold">
                            {betData.generatedCrossings.reduce(
                              (sum, item) => sum + item.amount,
                              0,
                            )}
                          </div>
                        </div>
                        <Button
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 text-lg rounded-full"
                          onClick={() => {
                            if (betData.generatedCrossings.length > 0) {
                              // Prepare crossing bet data for submission
                              const crossingBetData = {
                                gameId: game!._id,
                                betType: "crossing" as const,
                                crossingNumbers: betData.crossingNumbers,
                                crossingAmount: parseFloat(
                                  betData.crossingAmount,
                                ),
                                combinations: betData.generatedCrossings,
                                jodaCut: betData.jodaCut,
                                totalAmount: betData.generatedCrossings.reduce(
                                  (sum, item) => sum + item.amount,
                                  0,
                                ),
                              };

                              // Set the bet data and show modal for final confirmation
                              setBetData((prev) => ({
                                ...prev,
                                betNumber: `Crossing: ${betData.crossingNumbers}`,
                                betAmount:
                                  crossingBetData.totalAmount.toString(),
                              }));
                              setShowBetModal(true);
                            } else {
                              alert(
                                "Please generate crossing combinations first",
                              );
                            }
                          }}
                          disabled={betData.generatedCrossings.length === 0}
                        >
                          SUBMIT
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bet Modal */}
       <Dialog
  open={showBetModal}
  onOpenChange={setShowBetModal}
>
  <DialogContent className="bg-matka-dark border-border">
    <DialogHeader>
      <DialogTitle className="text-matka-gold">
        Confirm Your Bet (Real Money)
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-muted-foreground">Bet Type</Label>
          <p className="text-foreground font-semibold capitalize">
            {selectedBetType}
          </p>
        </div>

        <div>
          <Label className="text-muted-foreground">Number</Label>
          <p className="text-foreground font-semibold">
            {selectedBetType === "haruf"
              ? Object.entries(betData.harufBets || {})
                  .filter(([_, v]) => v > 0)
                  .map(([k, v]) => `${k}: ₹${v}`)
                  .join(", ")
              : betData.betNumber}
          </p>
        </div>

        <div>
          <Label className="text-muted-foreground">Payout Rate</Label>
          <p className="text-foreground font-semibold">
            {selectedBetType === "jodi"
              ? game.jodiPayout
              : selectedBetType === "haruf"
              ? game.harufPayout
              : game.crossingPayout}
            :1
          </p>
        </div>

        {selectedBetType === "haruf" && (
          <div>
            <Label className="text-muted-foreground">Position</Label>
            <p className="text-foreground font-semibold capitalize">
              Multiple
            </p>
          </div>
        )}
      </div>

      {/* 💸 Amount Field Only For jodi/crossing */}
      {selectedBetType !== "haruf" && (
        <div>
          <Label className="text-foreground">Bet Amount (₹)</Label>
          <Input
            type="number"
            placeholder={`Min: ₹${game.minBet}, Max: ₹${game.maxBet}`}
            value={betData.betAmount}
            onChange={(e) =>
              setBetData((prev) => ({
                ...prev,
                betAmount: e.target.value,
              }))
            }
            className="mt-2"
          />
        </div>
      )}

      {/* 🎯 Potential Winning */}
      {betData.betAmount && selectedBetType !== "haruf" && (
        <div className="p-3 bg-matka-gold/10 rounded border border-matka-gold/30">
          <p className="text-sm text-muted-foreground">Potential Winning</p>
          <p className="text-xl font-bold text-matka-gold">
            ₹
            {(
              parseFloat(betData.betAmount || "0") *
              (selectedBetType === "jodi"
                ? game.jodiPayout
                : game.crossingPayout)
            ).toLocaleString()}
          </p>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setShowBetModal(false)}
        className="border-border text-foreground"
      >
        Cancel
      </Button>

      {selectedBetType !== "haruf" && (
        <Button
          onClick={handlePlaceBet}
          disabled={placing || !betData.betAmount}
          className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
        >
          {placing ? "Placing..." : "Place Bet"}
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>

      </div>
    </div>
  );
};

export default GamePlay;
