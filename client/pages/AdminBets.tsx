import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DollarSign,
  Clock,
  Target,
  Zap,
  User,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Bet {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
  };
  gameId: string;
  gameName: string;
  gameType: "jodi" | "haruf" | "crossing";
  betType: "jodi" | "haruf" | "crossing";
  betNumber: string;
  betAmount: number;
  potentialWinning: number;
  winningAmount?: number;
  actualPayout?: number;
  isWinner?: boolean;
  status: "pending" | "won" | "lost" | "cancelled" | "refunded";
  betPlacedAt: string;
  gameDate: string;
  gameTime: string;
  betData?: {
    jodiNumber?: string;
    harufDigit?: string;
    harufPosition?: "first" | "last";
    crossingCombination?: string;
     originalInput?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BetStats {
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
}

const AdminBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [gameId, setGameId] = useState("");
const [gamesList, setGamesList] = useState<{ _id: string; name: string }[]>([]);
const [startTime, setStartTime] = useState("");
const [endTime, setEndTime] = useState("");


  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchBets();
  }, [navigate, statusFilter, gameTypeFilter]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBets();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter, gameTypeFilter]);


  useEffect(() => {
  const fetchGames = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/admin/games/dropdown`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("Games Response:", data);
      if (data.success) setGamesList(data.data);
    } catch (err) {
      console.error("Failed to load games:", err);
    }
  };
  fetchGames();
}, []);


  const fetchBets = async () => {
    try {
      if (!loading) setRefreshing(true);

      const token = localStorage.getItem("admin_token");
      const queryParams = new URLSearchParams({
        limit: "100",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(gameTypeFilter !== "all" && { gameType: gameTypeFilter }),
      });

      const url = `${BASE_URL}/api/admin/bets?${queryParams}`;
      console.log('🔍 AdminBets: Making request to:', url);
      console.log('🔍 AdminBets: BASE_URL:', BASE_URL);
      console.log('🔍 AdminBets: Token present:', !!token);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔍 AdminBets: Response status:', response.status);
      console.log('🔍 AdminBets: Response OK:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔍 AdminBets: 401 Unauthorized - redirecting to login');
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          navigate("/admin/login");
          return;
        }
        console.error('🔍 AdminBets: HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setBets(data.data.bets);

        // Calculate stats
        const betsData = data.data.bets;
        const stats: BetStats = {
          totalBets: betsData.length,
          totalAmount: betsData.reduce(
            (sum: number, bet: Bet) => sum + bet.betAmount,
            0,
          ),
          totalWinnings: betsData.reduce(
            (sum: number, bet: Bet) => sum + (bet.winningAmount || 0),
            0,
          ),
          pendingBets: betsData.filter((bet: Bet) => bet.status === "pending")
            .length,
          wonBets: betsData.filter((bet: Bet) => bet.status === "won").length,
          lostBets: betsData.filter((bet: Bet) => bet.status === "lost").length,
        };
        setStats(stats);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "won":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Lost
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            {status}
          </Badge>
        );
    }
  };

const handleExport = async () => {
  if (!gameId || !startTime || !endTime) {
    alert("Please select game and both date/time fields");
    return;
  }

  const token = localStorage.getItem("admin_token");

  try {
    const response = await fetch(
      `${BASE_URL}/api/admin/export-bets?gameId=${gameId}&startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bets_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Download failed", err);
      console.error("❌ Export failed:", err.stack || err);
    alert("Failed to export bets");
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
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  // 🧠 Group crossing bets by originalInput + gameId + user
const groupedBetsMap: { [key: string]: Bet[] } = {};

for (const bet of bets) {
  const isCrossing = bet.betType === "crossing";
  const groupKey = isCrossing && bet.betData?.originalInput
    ? `${bet.userId._id}-${bet.gameId}-${bet.betData.originalInput}`
    : bet._id;

  if (!groupedBetsMap[groupKey]) groupedBetsMap[groupKey] = [];
  groupedBetsMap[groupKey].push(bet);
}

const groupedBets = Object.values(groupedBetsMap);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Betting Management
                {autoRefresh && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </h1>
              <p className="text-gray-400 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && " • Auto-refreshing every 10s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
              className={`${
                autoRefresh
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-gray-500/20 border-gray-500 text-gray-400"
              }`}
            >
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </Button>
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
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {stats.totalBets}
                  </p>
                  <p className="text-sm text-gray-400">Total Bets</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/20 border-red-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    ₹{stats.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-300">Total Amount</p>
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

            <Card className="bg-yellow-500/20 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.pendingBets}
                  </p>
                  <p className="text-sm text-yellow-300">Pending</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {stats.wonBets}
                  </p>
                  <p className="text-sm text-green-300">Won</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/20 border-red-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {stats.lostBets}
                  </p>
                  <p className="text-sm text-red-300">Lost</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Game dropdown */}
  <div>
    <label className="text-sm text-gray-400 mb-2 block">Game</label>
    <Select value={gameId} onValueChange={setGameId}>
      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
        <SelectValue placeholder="Select Game" />
      </SelectTrigger>
      <SelectContent>
        {gamesList.map((g) => (
          <SelectItem key={g._id} value={g._id}>
            {g.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Start time */}
  <div>
    <label className="text-sm text-gray-400 mb-2 block">Start Time</label>
    <input
      type="datetime-local"
      value={startTime}
      onChange={(e) => setStartTime(e.target.value)}
      className="w-full bg-[#1a1a1a] border border-gray-600 text-white rounded p-2"
    />
  </div>

  {/* End time */}
  <div>
    <label className="text-sm text-gray-400 mb-2 block">End Time</label>
    <input
      type="datetime-local"
      value={endTime}
      onChange={(e) => setEndTime(e.target.value)}
      className="w-full bg-[#1a1a1a] border border-gray-600 text-white rounded p-2"
    />
  </div>

  {/* Export Button */}
  <div className="flex items-end">
    <Button
      className="w-full bg-green-600 text-white hover:bg-green-700"
      onClick={handleExport}
    >
      Export CSV
    </Button>
  </div>
</div>


              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Game Type
                </label>
                <Select
                  value={gameTypeFilter}
                  onValueChange={setGameTypeFilter}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="jodi">Jodi</SelectItem>
                    <SelectItem value="haruf">Haruf</SelectItem>
                    <SelectItem value="crossing">Crossing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchBets}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                >
                  Apply Filters
                </Button>

         

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bets Table */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Bets ({groupedBets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Bets Found
                </h3>
                <p className="text-gray-400">
                  No bets match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">
                        Game & Type
                      </TableHead>
                      <TableHead className="text-gray-300">Number</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">
                        Potential Win
                      </TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">
                        Date & Time
                      </TableHead>
                      <TableHead className="text-gray-300">Result</TableHead>
                    </TableRow>
                  </TableHeader>
          <TableBody>
  {groupedBets.map((group, index) => {
    const first = group[0];
    const isCrossing = first.betType === "crossing";
    const totalAmount = group.reduce((sum, b) => sum + b.betAmount, 0);
    const totalPotential = group.reduce((sum, b) => sum + b.potentialWinning, 0);
    const totalWin = group.reduce((sum, b) => sum + (b.winningAmount || 0), 0);
    const isAnyWon = group.some((b) => b.status === "won");

    return (
      <TableRow key={index} className="border-gray-700">
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-white">{first.userId.fullName}</p>
              <p className="text-sm text-gray-400">{first.userId.mobile}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getBetTypeIcon(first.betType)}
            <div>
              <p className="font-medium text-white">{first.gameName}</p>
              <p className="text-sm text-gray-400">
                {first.betType.toUpperCase()}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="font-mono bg-gray-700 text-yellow-400 border-yellow-400/30"
          >
            {isCrossing && first.betData?.originalInput
              ? `Crossing: ${first.betData.originalInput}`
              : first.betNumber}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-red-400">
            ₹{totalAmount.toLocaleString()}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-green-400 font-semibold">
            ₹{totalPotential.toLocaleString()}
          </span>
        </TableCell>
        <TableCell>{getStatusBadge(isAnyWon ? "won" : first.status)}</TableCell>
        <TableCell>
          <div className="text-sm">
            <p className="text-white">
              {new Date(first.betPlacedAt).toLocaleDateString()}
            </p>
            <p className="text-gray-400">
              {new Date(first.betPlacedAt).toLocaleTimeString()}
            </p>
          </div>
        </TableCell>
        <TableCell>
          {isAnyWon && totalWin > 0 ? (
            <span className="font-bold text-green-400">
              +₹{totalWin.toLocaleString()}
            </span>
          ) : first.status === "lost" ? (
            <span className="text-red-400">Lost</span>
          ) : (
            <span className="text-yellow-400">Pending</span>
          )}
        </TableCell>
      </TableRow>
    );
  })}
</TableBody>


                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBets;
