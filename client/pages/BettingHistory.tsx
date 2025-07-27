import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";

interface Bet {
  _id: string;
  gameId: {
    _id: string;
    name: string;
    type: string;
  };
  gameName: string;
  gameType: string;
  betType: "jodi" | "haruf" | "crossing";
  betNumber: string;
  betAmount: number;
  potentialWinning: number;
  winningAmount?: number;
  actualPayout?: number;
  isWinner: boolean;
  status: "pending" | "won" | "lost";
  betPlacedAt: string;
  gameDate: string;
  gameTime: string;
  betData?: {
    jodiNumber?: string;
    harufDigit?: string;
    harufPosition?: "first" | "last";
    crossingCombination?: string;
  };
}

interface BetStats {
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  winPercentage: number;
  netProfit: number;
}

const BettingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [betTypeFilter, setBetTypeFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchBets();
  }, [user, navigate, statusFilter, gameTypeFilter, betTypeFilter]);

  const fetchBets = async () => {
    try {
      if (!loading) setRefreshing(true);

      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        limit: "50",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(gameTypeFilter !== "all" && { gameType: gameTypeFilter }),
        ...(betTypeFilter !== "all" && { betType: betTypeFilter }),
      });

      const response = await fetch(`${BASE_URL}/api/games/user-bets?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBets(data.data.bets);

        // Calculate stats
        const betsData = data.data.bets;
        const totalBets = betsData.length;
        const totalAmount = betsData.reduce(
          (sum: number, bet: Bet) => sum + bet.betAmount,
          0,
        );
        const totalWinnings = betsData.reduce(
          (sum: number, bet: Bet) => sum + (bet.winningAmount || 0),
          0,
        );
        const wonBets = betsData.filter(
          (bet: Bet) => bet.status === "won",
        ).length;
        const winPercentage = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
        const netProfit = totalWinnings - totalAmount;

        setStats({
          totalBets,
          totalAmount,
          totalWinnings,
          winPercentage,
          netProfit,
        });
      }
    } catch (error) {
      console.error("Error fetching betting history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-500";
      case "lost":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="h-4 w-4" />;
      case "lost":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getBetTypeIcon = (betType: string) => {
    switch (betType) {
      case "jodi":
        return <Target className="h-4 w-4" />;
      case "haruf":
        return <Zap className="h-4 w-4" />;
      case "crossing":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matka-dark">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              My Betting History
            </h1>
          </div>
          <Button
            onClick={fetchBets}
            disabled={refreshing}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalBets}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/20 border-red-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    ₹{stats.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-300">Total Bet Amount</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    ₹{stats.totalWinnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-300">Total Winnings</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/20 border-blue-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.winPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-300">Win Rate</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`${stats.netProfit >= 0 ? "bg-green-500/20 border-green-500/30" : "bg-red-500/20 border-red-500/30"}`}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <p
                    className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {stats.netProfit >= 0 ? "+" : ""}₹
                    {stats.netProfit.toLocaleString()}
                  </p>
                  <p
                    className={`text-sm ${stats.netProfit >= 0 ? "text-green-300" : "text-red-300"}`}
                  >
                    Net {stats.netProfit >= 0 ? "Profit" : "Loss"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-foreground text-sm">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-foreground text-sm">Game Type:</label>
                <Select
                  value={gameTypeFilter}
                  onValueChange={setGameTypeFilter}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="jodi">Jodi</SelectItem>
                    <SelectItem value="haruf">Haruf</SelectItem>
                    <SelectItem value="crossing">Crossing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-foreground text-sm">Bet Type:</label>
                <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="jodi">Jodi</SelectItem>
                    <SelectItem value="haruf">Haruf</SelectItem>
                    <SelectItem value="crossing">Crossing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting History */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Betting History ({bets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bets.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  No betting history found
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Start playing games to see your betting history here
                </p>
                <Button
                  onClick={() => navigate("/games")}
                  className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                >
                  Play Games Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bets.map((bet) => (
                  <Card key={bet._id} className="bg-muted/20 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={getStatusColor(bet.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(bet.status)}
                                <span className="capitalize">{bet.status}</span>
                              </div>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(bet.betPlacedAt)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatTime(bet.gameTime)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-foreground font-semibold flex items-center gap-2">
                                {getBetTypeIcon(bet.betType)}
                                {bet.gameName}
                              </p>
                              <p className="text-muted-foreground text-sm capitalize">
                                {bet.betType} • {bet.gameType}
                              </p>
                              <p className="text-matka-gold text-sm font-bold">
                                Number: {bet.betNumber}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-muted-foreground text-xs">
                                Bet Amount
                              </p>
                              <p className="text-foreground font-bold text-lg">
                                ₹{bet.betAmount.toLocaleString()}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-muted-foreground text-xs">
                                {bet.status === "won"
                                  ? "Winning Amount"
                                  : "Potential Win"}
                              </p>
                              <p
                                className={`font-bold text-lg ${bet.status === "won" ? "text-green-500" : "text-blue-400"}`}
                              >
                                ₹
                                {(
                                  bet.winningAmount || bet.potentialWinning
                                ).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-muted-foreground text-xs">
                                Net Result
                              </p>
                              <p
                                className={`font-bold text-lg ${
                                  bet.status === "won"
                                    ? "text-green-500"
                                    : bet.status === "lost"
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                }`}
                              >
                                {bet.status === "won"
                                  ? `+₹${((bet.winningAmount || 0) - bet.betAmount).toLocaleString()}`
                                  : bet.status === "lost"
                                    ? `-₹${bet.betAmount.toLocaleString()}`
                                    : "Pending"}
                              </p>
                            </div>
                          </div>

                          {bet.betData && (
                            <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                              {bet.betType === "haruf" &&
                                bet.betData.harufPosition && (
                                  <span className="text-muted-foreground">
                                    Position: {bet.betData.harufPosition} digit
                                  </span>
                                )}
                              {bet.betType === "crossing" &&
                                bet.betData.crossingCombination && (
                                  <span className="text-muted-foreground">
                                    Combination:{" "}
                                    {bet.betData.crossingCombination}
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BettingHistory;
