import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Target,
  Zap,
  Play,
  Star,
  TrendingUp,
  Users,
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

interface GameResult {
  _id: string;
  gameName: string;
  gameType: string;
  jodiResult?: string;
  harufResult?: string;
  crossingResult?: string;
  resultDate: string;
  drawTime: string;
}

const Games = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchGames();
    fetchRecentResults();
  }, [user, navigate]);

  const fetchGames = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/games`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("matka_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/games/results?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
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
        return status;
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case "jodi":
        return Target;
      case "haruf":
        return Zap;
      case "crossing":
        return Trophy;
      default:
        return Play;
    }
  };

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case "jodi":
        return "from-blue-500 to-blue-600";
      case "haruf":
        return "from-green-500 to-green-600";
      case "crossing":
        return "from-purple-500 to-purple-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const filteredGames = games.filter((game) => {
    if (activeTab === "all") return true;
    return game.type === activeTab;
  });

  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
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
            <h1 className="text-2xl font-bold text-foreground">Matka Games</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-matka-gold text-matka-dark">
              <Users className="h-3 w-3 mr-1" />
              {games.filter((g) => g.currentStatus === "open").length} Live
              Games
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Games List */}
          <div className="lg:col-span-2">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Available Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">All Games</TabsTrigger>
                    <TabsTrigger value="jodi">Jodi</TabsTrigger>
                    <TabsTrigger value="haruf">Haruf</TabsTrigger>
                    <TabsTrigger value="crossing">Crossing</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
                    {filteredGames.length === 0 ? (
                      <div className="text-center py-8">
                        <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No games available
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredGames.map((game) => {
                          const IconComponent = getGameIcon(game.type);
                          return (
                            <Card
                              key={game._id}
                              className="bg-card border-border hover:border-matka-gold/50 transition-all duration-300 cursor-pointer group"
                              onClick={() => navigate(`/game/${game._id}`)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div
                                        className={`w-10 h-10 bg-gradient-to-br ${getGameTypeColor(game.type)} rounded-full flex items-center justify-center`}
                                      >
                                        <IconComponent className="h-5 w-5 text-white" />
                                      </div>
                                      <div>
                                        <h3 className="text-foreground font-semibold text-lg">
                                          {game.name}
                                        </h3>
                                        <p className="text-muted-foreground text-sm capitalize">
                                          {game.type} Game
                                        </p>
                                      </div>
                                      <Badge
                                        className={getStatusColor(
                                          game.currentStatus,
                                        )}
                                      >
                                        {getStatusText(game.currentStatus)}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                      <div>
                                        <p className="text-muted-foreground text-xs">
                                          Start Time
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatTime(game.startTime)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">
                                          End Time
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatTime(game.endTime)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">
                                          Min Bet
                                        </p>
                                        <p className="text-foreground font-medium">
                                          ₹{game.minBet}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">
                                          Max Payout
                                        </p>
                                        <p className="text-green-500 font-medium">
                                          {game.type === "jodi" &&
                                            `${game.jodiPayout}:1`}
                                          {game.type === "haruf" &&
                                            `${game.harufPayout}:1`}
                                          {game.type === "crossing" &&
                                            `${game.crossingPayout}:1`}
                                        </p>
                                      </div>
                                    </div>

                                    <p className="text-muted-foreground text-sm mb-3">
                                      {game.description}
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark group-hover:scale-105 transition-transform"
                                      disabled={game.currentStatus !== "open"}
                                    >
                                      <Play className="h-3 w-3 mr-1" />
                                      {game.currentStatus === "open"
                                        ? "Play Now"
                                        : "Not Available"}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Results */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      No recent results
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.slice(0, 5).map((result) => (
                      <div
                        key={result._id}
                        className="p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-foreground font-medium text-sm">
                              {result.gameName}
                            </h4>
                            <p className="text-muted-foreground text-xs">
                              {formatDate(result.resultDate)} •{" "}
                              {result.drawTime}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-matka-gold text-matka-gold"
                          >
                            {result.gameType}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                        <div className="flex justify-between">
  <span className="text-muted-foreground text-xs">Jodi:</span>
  <span className="text-foreground font-bold">
    {result?.jodiResult || result?.declaredResult || "-"}
  </span>
</div>

                          {result.harufResult && (
                          <div className="flex justify-between">
                          <span className="text-muted-foreground text-xs">Haruf:</span>
                          <span className="text-foreground font-bold">
                            {result?.harufResult || result?.declaredResult || "-"}
                          </span>
                        </div>
                        
                          )}
                          {result.crossingResult && (
                            <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">Crossing:</span>
                            <span className="text-foreground font-bold">
                              {result?.crossingResult || result?.declaredResult || "-"}
                            </span>
                          </div>
                          
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/results")}
                  className="w-full mt-4 border-border text-foreground hover:bg-muted"
                >
                  View All Results
                </Button>
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Jodi Game
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Select any 2-digit number from 00 to 99. If your number
                    matches the result, you win!
                  </p>
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    Haruf Game
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Bet on the first or last digit of the Jodi result. Higher
                    chances of winning!
                  </p>
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    Crossing Game
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Advanced game with special crossing combinations. Highest
                    payouts!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-matka-gold/20 to-yellow-500/20 border-matka-gold/30">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-matka-gold mx-auto mb-2" />
                <h3 className="text-foreground font-semibold mb-1">
                  Live Games Available
                </h3>
                <p className="text-2xl font-bold text-matka-gold mb-1">
                  {games.filter((g) => g.currentStatus === "open").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Games ready for betting now
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;
