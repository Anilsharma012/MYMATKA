import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Target,
  Zap,
} from "lucide-react";

interface Bet {
  _id: string;
  gameId: string;
  gameName: string;
  gameType: string;
  betType: string;
  betNumber: string;
  betAmount: number;
  potentialWinning: number;
  status: "pending" | "won" | "lost";
  isWinner: boolean;
  winningAmount?: number;
  betPlacedAt: string;
  gameDate: string;
  gameTime: string;
}

interface BetStats {
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
}

const MyBets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats>({
    totalBets: 0,
    totalAmount: 0,
    totalWinnings: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    gameType: "all",
    status: "all",
    search: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyBets();
  }, [user, navigate]);

  const fetchMyBets = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        page: "1",
        limit: "100",
        ...(filters.gameType !== "all" && { gameType: filters.gameType }),
        ...(filters.status !== "all" && { status: filters.status }),
      });

      const response = await fetch(`${BASE_URL}/api/games/user-bets?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBets(data.data.bets || []);
        calculateStats(data.data.bets || []);
      } else if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again",
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your bets",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (betsData: Bet[]) => {
    const stats = betsData.reduce(
      (acc, bet) => {
        acc.totalBets++;
        acc.totalAmount += bet.betAmount;

        if (bet.status === "pending") acc.pendingBets++;
        else if (bet.status === "won") {
          acc.wonBets++;
          acc.totalWinnings += bet.winningAmount || 0;
        } else if (bet.status === "lost") acc.lostBets++;

        return acc;
      },
      {
        totalBets: 0,
        totalAmount: 0,
        totalWinnings: 0,
        pendingBets: 0,
        wonBets: 0,
        lostBets: 0,
      },
    );

    setStats(stats);
  };

  const filteredBets = bets.filter((bet) => {
    const matchesSearch =
      bet.gameName.toLowerCase().includes(filters.search.toLowerCase()) ||
      bet.betNumber.includes(filters.search) ||
      bet.betType.toLowerCase().includes(filters.search.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: string, isWinner: boolean) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "won":
        return <Badge className="bg-green-100 text-green-800">Won</Badge>;
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:text-matka-gold self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                My Bets
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track all your betting activity
              </p>
            </div>
          </div>
          <Button
            onClick={() => fetchMyBets(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-matka-gold text-matka-gold hover:bg-matka-gold hover:text-matka-dark"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Bets</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalBets}
                  </p>
                </div>
                <Target className="h-8 w-8 text-matka-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{stats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total Winnings
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    ₹{stats.totalWinnings.toLocaleString()}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Bets</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {stats.pendingBets}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by game, number, type..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Game Type
                </label>
                <Select
                  value={filters.gameType}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, gameType: value }))
                  }
                >
                  <SelectTrigger>
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
                <label className="text-sm text-muted-foreground">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
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
                  onClick={() => fetchMyBets()}
                  className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bets Table */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Betting History ({filteredBets.length} bets)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBets.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Bets Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {bets.length === 0
                    ? "You haven't placed any bets yet. Start playing to see your betting history here!"
                    : "No bets match your current filters. Try adjusting your search criteria."}
                </p>
                <Button
                  onClick={() => navigate("/games")}
                  className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                >
                  Play Games
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game & Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Potential Win</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Winning</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBets.map((bet) => (
                        <TableRow key={bet._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getBetTypeIcon(bet.betType)}
                              <div>
                                <p className="font-medium text-foreground">
                                  {bet.gameName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {bet.betType.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {bet.betNumber}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-foreground">
                              ₹{bet.betAmount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-semibold">
                              ₹{bet.potentialWinning.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(bet.status, bet.isWinner)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-foreground">
                                {new Date(bet.betPlacedAt).toLocaleDateString()}
                              </p>
                              <p className="text-muted-foreground">
                                {new Date(bet.betPlacedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {bet.status === "won" && bet.winningAmount ? (
                              <span className="font-bold text-green-600">
                                +₹{bet.winningAmount.toLocaleString()}
                              </span>
                            ) : bet.status === "lost" ? (
                              <span className="text-red-600">-</span>
                            ) : (
                              <span className="text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {filteredBets.map((bet) => (
                    <Card key={bet._id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getBetTypeIcon(bet.betType)}
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {bet.gameName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bet.betType.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              bet.status === "won"
                                ? "default"
                                : bet.status === "lost"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {bet.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Number</p>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {bet.betNumber}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold text-foreground">
                              ₹{bet.betAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Potential Win
                            </p>
                            <p className="text-green-600 font-semibold">
                              ₹{bet.potentialWinning.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {bet.status === "won" ? "Won" : "Winning"}
                            </p>
                            {bet.status === "won" && bet.winningAmount ? (
                              <span className="text-green-600 font-bold">
                                ₹{bet.winningAmount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {bet.status === "pending" ? "Pending" : "-"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(bet.gameDate).toLocaleDateString()}
                            </span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>
                              {new Date(bet.betPlacedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyBets;
