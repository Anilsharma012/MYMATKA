import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Clock, Users } from "lucide-react";

interface MatkaGame {
  id: string;
  name: string;
  icon: string;
  players: number;
  status: "Open" | "Closed" | "Result Time";
  color: string;
  startTime: string;
  endTime: string;
  resultTime: string;
}

const MatkaGames = () => {
  const navigate = useNavigate();

  // Simplified matka games list
  const games: MatkaGame[] = [
    {
      id: "delhi-bazar",
      name: "Delhi Bazar",
      icon: "🦁",
      players: 365355,
      status: "Open",
      color: "from-yellow-500 to-yellow-600",
      startTime: "08:00",
      endTime: "14:40",
      resultTime: "15:15",
    },
    {
      id: "goa-market",
      name: "Goa Market",
      icon: "🏖️",
      players: 256663,
      status: "Open",
      color: "from-blue-500 to-blue-600",
      startTime: "08:00",
      endTime: "16:10",
      resultTime: "16:30",
    },
    {
      id: "shri-ganesh",
      name: "Shri Ganesh",
      icon: "🐘",
      players: 189660,
      status: "Open",
      color: "from-orange-500 to-orange-600",
      startTime: "08:00",
      endTime: "16:15",
      resultTime: "16:50",
    },
    {
      id: "faridabad",
      name: "Faridabad",
      icon: "🏛️",
      players: 176530,
      status: "Open",
      color: "from-purple-500 to-purple-600",
      startTime: "08:00",
      endTime: "17:45",
      resultTime: "18:30",
    },
    {
      id: "ghaziabad",
      name: "Ghaziabad",
      icon: "🏗️",
      players: 161602,
      status: "Open",
      color: "from-green-500 to-green-600",
      startTime: "08:00",
      endTime: "20:45",
      resultTime: "21:30",
    },
    {
      id: "gali",
      name: "Gali",
      icon: "🛣���",
      players: 145821,
      status: "Open",
      color: "from-red-500 to-red-600",
      startTime: "08:00",
      endTime: "23:10",
      resultTime: "00:30",
    },
    {
      id: "disawer",
      name: "Disawer",
      icon: "🎯",
      players: 198742,
      status: "Open",
      color: "from-pink-500 to-pink-600",
      startTime: "08:00",
      endTime: "03:30",
      resultTime: "06:00",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-green-500 text-white";
      case "Closed":
        return "bg-yellow-500 text-black";
      case "Result Time":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-700/50 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-white font-bold text-2xl">
                  🏺 Matka Games
                </h1>
                <p className="text-gray-400 text-sm">
                  Choose your game and start betting
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Simple Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="bg-white/10 backdrop-blur-md border-gray-700/50 hover:bg-white/15 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer group hover:scale-105"
            >
              <CardContent className="p-6">
                {/* Game Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center text-xl`}
                    >
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Users className="h-4 w-4" />
                        {game.players.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(game.status)} text-sm`}>
                    {game.status}
                  </Badge>
                </div>

                {/* Game Timing */}
                <div className="space-y-3 mb-6">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Close Time</p>
                        <p className="text-white font-medium">{game.endTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Result Time</p>
                        <p className="text-white font-medium">
                          {game.resultTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Play Button */}
                <Button
                  className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-bold py-3 text-base rounded-xl transition-all duration-300 group-hover:shadow-lg`}
                  disabled={game.status === "Closed"}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {game.status === "Open"
                    ? "Play Now"
                    : game.status === "Closed"
                      ? "Betting Closed"
                      : "View Results"}
                </Button>

                {/* Special indicator for Disawer */}
                {game.name === "Disawer" && (
                  <div className="mt-3 text-center">
                    <Badge className="bg-pink-500/20 text-pink-400 text-xs">
                      🎯 Featured Game
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simple Info Section */}
        <Card className="mt-8 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-md border-yellow-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-white font-bold text-xl mb-2">
                🧩 Play Responsibly
              </h3>
              <p className="text-gray-300 text-base max-w-2xl mx-auto">
                All games start at 8:00 AM daily. Each game has specific closing
                times with results declared at scheduled times. Only bet what
                you can afford to lose.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatkaGames;
