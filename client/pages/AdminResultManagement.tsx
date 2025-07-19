import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Target,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface Game {
  _id: string;
  name: string;
  endTime: string;
  currentStatus: string;
  declaredResult?: string;
  resultDeclaredAt?: string;
  resultMethod?: "manual" | "automatic";
  autoResultScheduled?: string;
  hoursUntilAutoResult?: number;
  isOverdue?: boolean;
}

interface ResultHistory {
  _id: string;
  name: string;
  declaredResult: string;
  resultDeclaredAt: string;
  resultMethod: "manual" | "automatic";
  resultDeclaredBy?: { name: string };
}

interface PendingStats {
  totalPending: number;
  overdueCount: number;
}

const AdminResultManagement = () => {
  const { toast } = useToast();
  const [pendingGames, setPendingGames] = useState<Game[]>([]);
  const [resultHistory, setResultHistory] = useState<ResultHistory[]>([]);
  const [pendingStats, setPendingStats] = useState<PendingStats>({
    totalPending: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [declareResult, setDeclareResult] = useState("");

  useEffect(() => {
    fetchPendingResults();
    fetchResultHistory();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPendingResults();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchPendingResults = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/results/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingGames(data.data.pendingGames);
        setPendingStats({
          totalPending: data.data.totalPending,
          overdueCount: data.data.overdueCount,
        });
      }
    } catch (error) {
      console.error("Error fetching pending results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResultHistory = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/results/history?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResultHistory(data.data.results);
      }
    } catch (error) {
      console.error("Error fetching result history:", error);
    }
  };

  const handleDeclareResult = async () => {
    if (!selectedGame || !declareResult.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a valid result number",
      });
      return;
    }

    setDeclaring(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/results/declare/${selectedGame._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ declaredResult: declareResult.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Result Declared Successfully",
          description: `Result ${declareResult} declared for ${selectedGame.name}. Processed ${data.data.processedBets.totalBets} bets.`,
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setShowDeclareModal(false);
        setSelectedGame(null);
        setDeclareResult("");
        fetchPendingResults();
        fetchResultHistory();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Declare Result",
          description: data.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error declaring result:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to connect to server",
      });
    } finally {
      setDeclaring(false);
    }
  };

  const getStatusColor = (game: Game) => {
    if (game.isOverdue) return "bg-red-500";
    if (game.hoursUntilAutoResult && game.hoursUntilAutoResult <= 2)
      return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getStatusText = (game: Game) => {
    if (game.isOverdue) return "Overdue";
    if (game.hoursUntilAutoResult && game.hoursUntilAutoResult <= 2)
      return "Due Soon";
    return "Pending";
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) return "Overdue";
    if (hours < 1) return "< 1 hour";
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            🧩 Result Management
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Unified result declaration system for all games
          </p>
        </div>
        <Button
          onClick={fetchPendingResults}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Responsive Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Pending Results
                </p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {pendingStats.totalPending}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {pendingStats.overdueCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent Results
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {resultHistory.length}
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
                  Auto Results
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    resultHistory.filter((r) => r.resultMethod === "automatic")
                      .length
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Results ({pendingStats.totalPending})
          </TabsTrigger>
          <TabsTrigger value="history">Result History</TabsTrigger>
        </TabsList>

        {/* Pending Results Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingGames.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All Results Declared
                </h3>
                <p className="text-gray-600">
                  No games are currently pending result declaration.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingGames.map((game) => (
                <Card
                  key={game._id}
                  className={`border-l-4 ${
                    game.isOverdue
                      ? "border-l-red-500"
                      : game.hoursUntilAutoResult &&
                          game.hoursUntilAutoResult <= 2
                        ? "border-l-yellow-500"
                        : "border-l-blue-500"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {game.name}
                          </h3>
                          <Badge
                            className={`${getStatusColor(game)} text-white`}
                          >
                            {getStatusText(game)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">End Time:</span>{" "}
                            {game.endTime}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{" "}
                            {game.currentStatus}
                          </div>
                          <div>
                            <span className="font-medium">Auto Result:</span>{" "}
                            {game.hoursUntilAutoResult !== undefined
                              ? formatTimeRemaining(game.hoursUntilAutoResult)
                              : "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span>{" "}
                            {game.isOverdue ? (
                              <span className="text-red-600 font-semibold">
                                High
                              </span>
                            ) : (
                              <span className="text-green-600">Normal</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedGame(game);
                            setShowDeclareModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Declare Result
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Result History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Result Declarations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No results declared yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Declared By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultHistory.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell className="font-medium">
                          {result.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-lg"
                          >
                            {result.declaredResult}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              result.resultMethod === "manual"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }
                          >
                            {result.resultMethod === "manual"
                              ? "Manual"
                              : "Automatic"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.resultDeclaredBy?.name || "System"}
                        </TableCell>
                        <TableCell>
                          {new Date(result.resultDeclaredAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Declare Result Modal */}
      <Dialog open={showDeclareModal} onOpenChange={setShowDeclareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Declare Result
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGame && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">
                  {selectedGame.name}
                </h3>
                <p className="text-sm text-blue-600">
                  End Time: {selectedGame.endTime} | Status:{" "}
                  {selectedGame.currentStatus}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="result" className="text-base font-medium">
                Winning Number
              </Label>
              <Input
                id="result"
                value={declareResult}
                onChange={(e) =>
                  setDeclareResult(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Enter single digit (0-9)"
                className="mt-2 text-lg text-center font-mono"
                maxLength={1}
              />
              <p className="text-xs text-gray-500 mt-1">
                This single number will apply to all bet types (Jodi, Haruf,
                Crossing)
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>This result will be applied to ALL bet types</li>
                    <li>Winners will be automatically calculated</li>
                    <li>Winnings will be added to user wallets</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclareModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclareResult}
              disabled={declaring || !declareResult.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {declaring ? "Declaring..." : "Declare Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResultManagement;
