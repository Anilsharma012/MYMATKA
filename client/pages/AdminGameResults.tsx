import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BASE_URL from "../src/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  Trophy,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
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
  currentStatus: string;
}

interface GameResult {
  _id: string;
  gameId: string;
  gameName: string;
  gameType: string;
  jodiResult?: string;
  harufResult?: string;
  crossingResult?: string;
  totalBets: number;
  totalBetAmount: number;
  totalWinningAmount: number;
  platformCommission: number;
  netProfit: number;
  status: "declared" | "pending";
  resultDate: string;
  declaredBy?: {
    fullName: string;
  };
  declaredAt?: string;
}

const AdminGameResults = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [stats, setStats] = useState({
    totalResults: 0,
    pendingCount: 0,
    declaredCount: 0,
    cancelledCount: 0,
    todayProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pending" | "declared" | "cancelled" | "all"
  >("pending");
  const [resultData, setResultData] = useState({
    jodiResult: "",
    harufResult: "",
    crossingResult: "",
    resultDate: new Date().toISOString().split("T")[0],
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchData();

    // Auto-refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const [gamesResponse, resultsResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/games`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/admin/game-results?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        const gamesList = gamesData.data.games || [];
        setGames(gamesList);
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        const resultsList = resultsData.data.results || [];
        setResults(resultsList);

        // Calculate real-time statistics after games are loaded
        setTimeout(() => {
          const today = new Date().toISOString().split("T")[0];
          const todayResults = resultsList.filter((r: GameResult) =>
            r.resultDate.startsWith(today),
          );

          // Use state variable instead of local variable
          const pendingGames = games.filter(
            (g: Game) =>
              g.currentStatus === "open" || g.currentStatus === "closed",
          ).length;

          const declaredToday = todayResults.filter(
            (r: GameResult) => r.status === "declared",
          ).length;

          const todayProfit = todayResults.reduce(
            (sum: number, r: GameResult) => sum + (r.netProfit || 0),
            0,
          );

          setStats({
            totalResults: resultsList.length,
            pendingCount: pendingGames,
            declaredCount: declaredToday,
            cancelledCount: 0, // Can be calculated if you have cancelled results
            todayProfit: todayProfit,
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set fallback stats to avoid showing empty data
      setStats({
        totalResults: results.length,
        pendingCount: games.filter(
          (g) => g.currentStatus === "open" || g.currentStatus === "closed",
        ).length,
        declaredCount: results.filter((r) => r.status === "declared").length,
        cancelledCount: 0,
        todayProfit: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareResult = async () => {
    if (!selectedGame) return;

    // Validate result data
    if (selectedGame.type === "jodi" && !resultData.jodiResult) {
      alert("Please enter Jodi result");
      return;
    }
    if (selectedGame.type === "haruf" && !resultData.harufResult) {
      alert("Please enter Haruf result");
      return;
    }
    if (selectedGame.type === "crossing" && !resultData.crossingResult) {
      alert("Please enter Crossing result");
      return;
    }

    setDeclaring(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/games/${selectedGame._id}/declare-result`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resultData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        const result = data.data;
        console.log("✅ Result declared successfully:", data);

        // Show success message using toast
        const successMessage = `Result Declared Successfully! Game: ${selectedGame.name}, Winners: ${result.winnersCount}, Profit: ₹${result.netProfit.toLocaleString()}`;

        // You can replace this with a toast notification if available
        alert(`🎉 ${successMessage}`);
        setShowDeclareModal(false);
        setSelectedGame(null);
        setResultData({
          jodiResult: "",
          harufResult: "",
          crossingResult: "",
          resultDate: new Date().toISOString().split("T")[0],
        });
        // Immediately refresh data to show updated statistics
        setTimeout(fetchData, 500);
      } else {
        console.error("❌ Failed to declare result:", data);
        alert(
          `❌ Failed to declare result: ${data.message || "Unknown error occurred"}`,
        );
      }
    } catch (error) {
      console.error("Error declaring result:", error);
      alert(
        "❌ Network error: Failed to declare result. Please check your connection and try again.",
      );
    } finally {
      setDeclaring(false);
    }
  };

  const openDeclareModal = (game: Game) => {
    setSelectedGame(game);
    setResultData({
      jodiResult: "",
      harufResult: "",
      crossingResult: "",
      resultDate: new Date().toISOString().split("T")[0],
    });
    setShowDeclareModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            <h1 className="text-2xl font-bold text-white">
              Game Results Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchData}
              className="bg-green-500 text-white hover:bg-green-600"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => {
                // Show first available pending game for quick declaration
                const pendingGame = games.find(
                  (g) =>
                    g.currentStatus === "open" || g.currentStatus === "closed",
                );
                if (pendingGame) {
                  openDeclareModal(pendingGame);
                } else {
                  alert("No pending games available for result declaration");
                }
              }}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.totalResults}
              </div>
              <div className="text-sm text-gray-400">Total Results</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-600 border-yellow-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.pendingCount}
              </div>
              <div className="text-sm text-yellow-100">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 border-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.declaredCount}
              </div>
              <div className="text-sm text-green-100">Declared</div>
            </CardContent>
          </Card>

          <Card className="bg-red-600 border-red-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.cancelledCount}
              </div>
              <div className="text-sm text-red-100">Cancelled</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-blue-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                ₹{stats.todayProfit.toLocaleString()}
              </div>
              <div className="text-sm text-blue-100">Today's Profit</div>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Active Games - Declare Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <Card key={game._id} className="bg-[#1a1a1a] border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">{game.name}</h3>
                      <Badge
                        className={
                          game.currentStatus === "open"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {game.currentStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <p>Type: {game.type.toUpperCase()}</p>
                      <p>
                        Time: {game.startTime} - {game.endTime}
                      </p>
                      <p>Result Time: {game.resultTime}</p>
                      <p>
                        Bet Range: ₹{game.minBet} - ₹{game.maxBet}
                      </p>
                    </div>
                    <Button
                      onClick={() => openDeclareModal(game)}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Declare Result
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Results Section */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Game Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs for filtering */}
            <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
              {[
                {
                  key: "pending",
                  label: `Pending (${stats.pendingCount})`,
                  color: "text-yellow-400",
                },
                {
                  key: "declared",
                  label: `Declared (${stats.declaredCount})`,
                  color: "text-green-400",
                },
                {
                  key: "cancelled",
                  label: `Cancelled (${stats.cancelledCount})`,
                  color: "text-red-400",
                },
                {
                  key: "all",
                  label: `All (${stats.totalResults})`,
                  color: "text-blue-400",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-gray-700 text-white"
                      : `hover:bg-gray-700 ${tab.color}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results Display */}
            {activeTab === "pending" && (
              <div className="space-y-4">
                {games.filter(
                  (game) =>
                    game.currentStatus === "open" ||
                    game.currentStatus === "closed",
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No pending results found</p>
                  </div>
                ) : (
                  games
                    .filter(
                      (game) =>
                        game.currentStatus === "open" ||
                        game.currentStatus === "closed",
                    )
                    .map((game) => (
                      <Card
                        key={game._id}
                        className="bg-[#1a1a1a] border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-yellow-500 text-black">
                                  PENDING
                                </Badge>
                                <h3 className="text-white font-semibold text-lg">
                                  {game.name}
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Date & Time</p>
                                  <p className="text-white">
                                    {new Date().toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-300">
                                    {game.startTime} - {game.endTime}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Winning Number
                                  </p>
                                  <p className="text-yellow-400 font-bold text-lg">
                                    -
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Bets & Winning
                                  </p>
                                  <p className="text-white">- bets</p>
                                  <p className="text-gray-300">₹-</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Profit</p>
                                  <p className="text-white">₹-</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openDeclareModal(game)}
                                className="bg-green-500 text-white hover:bg-green-600"
                                size="sm"
                              >
                                Declare
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            )}

            {(activeTab === "declared" || activeTab === "all") && (
              <div className="space-y-4">
                {results.filter(
                  (result) =>
                    activeTab === "all" || result.status === "declared",
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No results found</p>
                  </div>
                ) : (
                  results
                    .filter(
                      (result) =>
                        activeTab === "all" || result.status === "declared",
                    )
                    .slice(0, 20)
                    .map((result) => (
                      <Card
                        key={result._id}
                        className="bg-[#1a1a1a] border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-green-500 text-white">
                                  DECLARED
                                </Badge>
                                <h3 className="text-white font-semibold text-lg">
                                  {result.gameName}
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Date & Time</p>
                                  <p className="text-white">
                                    {formatDate(
                                      result.declaredAt || result.resultDate,
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Winning Number
                                  </p>
                                  <div className="space-y-1">
                                    {result.jodiResult && (
                                      <p className="text-yellow-400 font-bold text-lg">
                                        {result.jodiResult}
                                      </p>
                                    )}
                                    {result.harufResult && (
                                      <p className="text-yellow-400 font-bold">
                                        Haruf: {result.harufResult}
                                      </p>
                                    )}
                                    {result.crossingResult && (
                                      <p className="text-yellow-400 font-bold">
                                        Crossing: {result.crossingResult}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Bets & Winning
                                  </p>
                                  <p className="text-white">
                                    {result.totalBets} bets
                                  </p>
                                  <p className="text-gray-300">
                                    ₹
                                    {result.totalWinningAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Profit</p>
                                  <p
                                    className={`font-bold ${result.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                                  >
                                    ₹{result.netProfit.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            )}

            {activeTab === "cancelled" && (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No cancelled results found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Declare Result Modal */}
        <Dialog open={showDeclareModal} onOpenChange={setShowDeclareModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Declare Result - {selectedGame?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedGame && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-300">
                    <strong>Game:</strong> {selectedGame.name}
                  </p>
                  <p className="text-gray-300">
                    <strong>Type:</strong> {selectedGame.type.toUpperCase()}
                  </p>
                  <p className="text-gray-300">
                    <strong>Result Time:</strong> {selectedGame.resultTime}
                  </p>
                </div>

                <div>
                  <Label htmlFor="resultDate" className="text-gray-300">
                    Result Date
                  </Label>
                  <Input
                    id="resultDate"
                    type="date"
                    value={resultData.resultDate}
                    onChange={(e) =>
                      setResultData((prev) => ({
                        ...prev,
                        resultDate: e.target.value,
                      }))
                    }
                    className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>

                {(selectedGame.type === "jodi" ||
                  selectedGame.type === "haruf") && (
                  <div>
                    <Label htmlFor="jodiResult" className="text-gray-300">
                      Jodi Result (2 digits: 00-99)
                    </Label>
                    <Input
                      id="jodiResult"
                      placeholder="Enter 2-digit result (e.g., 56)"
                      value={resultData.jodiResult}
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          jodiResult: e.target.value,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      maxLength={2}
                    />
                  </div>
                )}

                {selectedGame.type === "haruf" && (
                  <div>
                    <Label htmlFor="harufResult" className="text-gray-300">
                      Haruf Result (1 digit: 0-9)
                    </Label>
                    <Input
                      id="harufResult"
                      placeholder="Enter single digit (e.g., 7)"
                      value={resultData.harufResult}
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          harufResult: e.target.value,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      maxLength={1}
                    />
                  </div>
                )}

                {selectedGame.type === "crossing" && (
                  <div>
                    <Label htmlFor="crossingResult" className="text-gray-300">
                      Crossing Result
                    </Label>
                    <Input
                      id="crossingResult"
                      placeholder="Enter crossing result"
                      value={resultData.crossingResult}
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          crossingResult: e.target.value,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                )}

                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded">
                  <p className="text-yellow-300 text-sm">
                    <strong>Warning:</strong> Once declared, this result cannot
                    be changed. All winning bets will be automatically credited
                    to users' wallets.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeclareModal(false)}
                disabled={declaring}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeclareResult}
                disabled={declaring}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                {declaring ? "Declaring..." : "Declare Result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminGameResults;
