import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Trophy,
  Wallet,
} from "lucide-react";

interface BettingStats {
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  winRate: number;
  favoriteGame: string;
  recentActivity: any[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    totalAmount: 0,
    totalWinnings: 0,
    winRate: 0,
    favoriteGame: "N/A",
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Mock data for now - in production, this would fetch from API
      setTimeout(() => {
        setStats({
          totalBets: 45,
          totalAmount: 12500,
          totalWinnings: 8750,
          winRate: 62.2,
          favoriteGame: "Delhi Bazar",
          recentActivity: [
            { game: "Delhi Bazar", amount: 500, result: "win", date: "Today" },
            {
              game: "Goa Market",
              amount: 200,
              result: "loss",
              date: "Yesterday",
            },
            {
              game: "Disawer",
              amount: 1000,
              result: "win",
              date: "2 days ago",
            },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark p-3 sm:p-4 lg:p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-foreground text-lg sm:text-xl lg:text-2xl font-bold">
                📊 Your Analytics
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Track your betting performance and insights
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Total Bets
                  </p>
                  <div className="text-foreground font-bold text-lg sm:text-xl lg:text-2xl">
                    {stats.totalBets}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Total Wagered
                  </p>
                  <div className="text-foreground font-bold text-lg sm:text-xl lg:text-2xl">
                    ₹{stats.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Total Winnings
                  </p>
                  <div className="text-foreground font-bold text-lg sm:text-xl lg:text-2xl">
                    ₹{stats.totalWinnings.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Win Rate
                  </p>
                  <div className="text-foreground font-bold text-lg sm:text-xl lg:text-2xl">
                    {stats.winRate}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Performance Overview */}
          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Profit/Loss
                  </span>
                  <div className="flex items-center gap-1">
                    {stats.totalWinnings - stats.totalAmount > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`font-bold ${
                        stats.totalWinnings - stats.totalAmount > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ₹
                      {Math.abs(
                        stats.totalWinnings - stats.totalAmount,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Favorite Game
                  </span>
                  <Badge className="bg-matka-gold/20 text-matka-gold">
                    {stats.favoriteGame}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Success Rate
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: `${stats.winRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {activity.game}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground text-sm">
                        ₹{activity.amount}
                      </p>
                      <Badge
                        className={`text-xs ${
                          activity.result === "win"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {activity.result === "win" ? "Won" : "Lost"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border-blue-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">
                  📈 Your Insights
                </h3>
                <div className="text-gray-300 text-sm sm:text-base space-y-1">
                  <p>
                    • You have a strong {stats.winRate}% win rate - above
                    average!
                  </p>
                  <p>• {stats.favoriteGame} is your most successful game</p>
                  <p>
                    • Consider diversifying across different games for better
                    returns
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Button
            onClick={() => navigate("/my-bets")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Target className="h-4 w-4 mr-2" />
            View Bets
          </Button>
          <Button
            onClick={() => navigate("/wallet")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </Button>
          <Button
            onClick={() => navigate("/matka-games")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Play Games
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
