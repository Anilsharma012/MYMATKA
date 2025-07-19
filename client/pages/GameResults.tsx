import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Clock,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Target,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface GameResult {
  gameId: string;
  gameName: string;
  declaredResult?: string;
  resultDeclaredAt?: string;
  resultMethod?: "manual" | "automatic";
  resultDeclaredBy?: string;
  status: string;
  resultDeclared: boolean;
}

interface UserBet {
  _id: string;
  betType: "jodi" | "haruf" | "crossing";
  betNumber: string;
  betAmount: number;
  potentialWin?: number;
  harufPosition?: string;
  crossingCombinations?: { number: string; amount: number }[];
  isWinning?: boolean | null;
  createdAt: string;
}

interface BetSummary {
  totalBets: number;
  winningBets: number;
  losingBets: number;
  totalWinAmount: number;
  resultDeclared: boolean;
}

const GameResults = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [betSummary, setBetSummary] = useState<BetSummary>({
    totalBets: 0,
    winningBets: 0,
    losingBets: 0,
    totalWinAmount: 0,
    resultDeclared: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      fetchGameResult();
      fetchUserBets();
    }

    // Auto-refresh every 30 seconds if result not declared
    const interval = setInterval(() => {
      if (gameId && (!gameResult || !gameResult.resultDeclared)) {
        fetchGameResult();
        fetchUserBets();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGameResult = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/results/game/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setGameResult(data.data);
      }
    } catch (error) {
      console.error("Error fetching game result:", error);
    }
  };

  const fetchUserBets = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      const response = await fetch(`${BASE_URL}/api/results/user-bets/${gameId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserBets(data.data.userBets);
        setBetSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching user bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBetTypeIcon = (betType: string) => {
    switch (betType) {
      case "jodi":
        return <Target className="h-4 w-4" />;
      case "haruf":
        return <TrendingUp className="h-4 w-4" />;
      case "crossing":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getBetTypeColor = (betType: string) => {
    switch (betType) {
      case "jodi":
        return "bg-blue-100 text-blue-800";
      case "haruf":
        return "bg-green-100 text-green-800";
      case "crossing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWinStatusBadge = (isWinning: boolean | null) => {
   if (!gameResult?.resultDeclared || isWinning === null || typeof isWinning === "undefined") {
  return (
    <Badge className="bg-yellow-100 text-yellow-800">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  );
}


    if (isWinning) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Won
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Lost
      </Badge>
    );
  };

  const formatBetNumber = (bet: UserBet) => {
    if (bet.betType === "crossing" && bet.crossingCombinations) {
      return bet.crossingCombinations.map((c) => c.number).join(", ");
    }

    if (bet.betType === "haruf" && bet.harufPosition) {
      return `${bet.betNumber} (${bet.harufPosition})`;
    }

    return bet.betNumber;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {gameResult?.gameName || "Game Results"}
            </h1>
            <p className="text-gray-600">
              View your betting results and game outcomes
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchGameResult();
              fetchUserBets();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Game Result Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              🧩 Game Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameResult?.resultDeclared ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
                    <span className="text-3xl font-bold text-white">
                      {gameResult.declaredResult}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Winning Number: {gameResult.declaredResult}
                  </h3>
                  <p className="text-gray-600">
                    This single number applies to all bet types (Jodi, Haruf,
                    Crossing)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="font-medium text-blue-900">Result Declared</p>
                    <p className="text-blue-600">
                      {new Date(gameResult.resultDeclaredAt!).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Target className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="font-medium text-green-900">Method</p>
                    <p className="text-green-600 capitalize">
                      {gameResult.resultMethod}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="font-medium text-purple-900">Declared By</p>
                    <p className="text-purple-600">
                      {gameResult.resultDeclaredBy || "System"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Result Pending
                </h3>
                <p className="text-gray-600 mb-4">
                  The result for this game has not been declared yet.
                </p>
                <div className="bg-yellow-50 p-4 rounded-lg inline-block">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Results are automatically declared 24 hours after game end
                      time
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Betting Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Bets
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {betSummary.totalBets}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Winning Bets
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {betSummary.winningBets}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Losing Bets
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {betSummary.losingBets}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Winnings
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{betSummary.totalWinAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Betting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No bets placed</p>
                <p>You haven't placed any bets for this game.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bet Type</TableHead>
                    <TableHead>Number(s)</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Potential Win</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userBets.map((bet) => (
                    <TableRow key={bet._id}>
                      <TableCell>
                        <Badge className={getBetTypeColor(bet.betType)}>
                          {getBetTypeIcon(bet.betType)}
                          <span className="ml-1 capitalize">{bet.betType}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatBetNumber(bet)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{bet.betAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₹{(bet.potentialWin || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{getWinStatusBadge(bet.isWinning)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(bet.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Winning Explanation */}
        {gameResult?.resultDeclared && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                How Winners Are Determined
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="space-y-3">
                <p className="font-medium">
                  🧩 Unified Result System: One number (
                  {gameResult.declaredResult}) for all bet types
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Jodi Bets
                    </h4>
                    <p>
                      Win if your number exactly matches{" "}
                      {gameResult.declaredResult}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Haruf Bets
                    </h4>
                    <p>
                      Win if {gameResult.declaredResult} appears in your chosen
                      position
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      Crossing Bets
                    </h4>
                    <p>
                      Win if any of your crossing numbers match{" "}
                      {gameResult.declaredResult}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameResults;
