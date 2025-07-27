import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  Settings,
  Save,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GameForm {
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  drawTime: string;
  description: string;
  maxBetAmount: string;
  minBetAmount: string;
  isActive: boolean;
  // Payout rates
  jodiPayout: string;
  harufPayout: string;
  crossingPayout: string;
}

const AdminCreateGame = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [gameForm, setGameForm] = useState<GameForm>({
    name: "",
    type: "crossing",
    startTime: "",
    endTime: "",
    drawTime: "",
    description: "",
    maxBetAmount: "50000",
    minBetAmount: "10",
    isActive: true,
    jodiPayout: "95",
    harufPayout: "9.5",
    crossingPayout: "9.5",
  });

  const gameTypes = [
    { value: "crossing", label: "Crossing" },
    { value: "jodi", label: "Jodi" },
    { value: "haruf", label: "Haruf" },
    { value: "mixed", label: "Mixed (All Types)" },
  ];

  // Popular game names suggestions
  const gameNameSuggestions = [
    "Delhi Bazar",
    "Disawer",
    "Gali",
    "Gaziyabad", 
    "Faridabad",
    "Ghaziabad",
    "New Delhi",
    "Taj",
    "Time Bazar",
    "Rajdhani Day",
    "Rajdhani Night",
    "Kalyan",
    "Milan Day",
    "Milan Night",
    "Sridevi",
    "Madhur Day",
    "Madhur Night",
    "Supreme Day",
    "Supreme Night",
  ];

  // Common time slots
  const timeSlots = [
    "05:00", "06:00", "07:00", "08:00", "09:00", "10:00",
    "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  const handleInputChange = (field: keyof GameForm, value: string | boolean) => {
    setGameForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = (): boolean => {
    if (!gameForm.name.trim()) {
      setError("Game name is required");
      return false;
    }
    if (!gameForm.startTime) {
      setError("Start time is required");
      return false;
    }
    if (!gameForm.endTime) {
      setError("End time is required");
      return false;
    }
    if (!gameForm.drawTime) {
      setError("Draw time is required");
      return false;
    }
    if (parseInt(gameForm.minBetAmount) >= parseInt(gameForm.maxBetAmount)) {
      setError("Maximum bet amount must be greater than minimum bet amount");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      // Runtime validation for production URLs
      const hostname = window.location.hostname;
      const isProduction = hostname.includes('.fly.dev') || !hostname.includes('localhost');
      let createUrl = `${BASE_URL}/api/admin/games`;
      
      if (isProduction && BASE_URL.includes('localhost')) {
        createUrl = `/api/admin/games`;
      }

      console.log("🎮 Creating game:", gameForm);
      
      const response = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: gameForm.name.trim(),
          type: gameForm.type,
          startTime: gameForm.startTime,
          endTime: gameForm.endTime,
          drawTime: gameForm.drawTime,
          description: gameForm.description.trim(),
          maxBetAmount: parseInt(gameForm.maxBetAmount),
          minBetAmount: parseInt(gameForm.minBetAmount),
          isActive: gameForm.isActive,
          payoutRates: {
            jodi: parseFloat(gameForm.jodiPayout),
            haruf: parseFloat(gameForm.harufPayout),
            crossing: parseFloat(gameForm.crossingPayout),
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setSuccess(`🎉 Game "${gameForm.name}" created successfully!`);
        
        // Reset form
        setTimeout(() => {
          navigate("/admin/game-management");
        }, 2000);
      } else {
        setError(data.message || "Failed to create game");
      }

    } catch (error) {
      console.error("Error creating game:", error);
      setError(error instanceof Error ? error.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Create New Game
          </h1>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <Settings className="h-4 w-4" />
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Game Information */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Basic Game Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Game Name *</Label>
                  <Input
                    id="name"
                    value={gameForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter game name..."
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {gameNameSuggestions.slice(0, 6).map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                        onClick={() => handleInputChange("name", suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="type" className="text-gray-300">Game Type *</Label>
                  <Select
                    value={gameForm.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select game type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {gameTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={gameForm.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Optional game description..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-gray-300">Start Time *</Label>
                  <Select
                    value={gameForm.startTime}
                    onValueChange={(value) => handleInputChange("startTime", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endTime" className="text-gray-300">End Time *</Label>
                  <Select
                    value={gameForm.endTime}
                    onValueChange={(value) => handleInputChange("endTime", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="drawTime" className="text-gray-300">Draw Time *</Label>
                  <Select
                    value={gameForm.drawTime}
                    onValueChange={(value) => handleInputChange("drawTime", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select draw time" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Betting Limits */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Betting Limits & Payouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minBetAmount" className="text-gray-300">Minimum Bet Amount (₹)</Label>
                  <Input
                    id="minBetAmount"
                    type="number"
                    value={gameForm.minBetAmount}
                    onChange={(e) => handleInputChange("minBetAmount", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxBetAmount" className="text-gray-300">Maximum Bet Amount (₹)</Label>
                  <Input
                    id="maxBetAmount"
                    type="number"
                    value={gameForm.maxBetAmount}
                    onChange={(e) => handleInputChange("maxBetAmount", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="jodiPayout" className="text-gray-300">Jodi Payout Rate</Label>
                  <Input
                    id="jodiPayout"
                    type="number"
                    step="0.1"
                    value={gameForm.jodiPayout}
                    onChange={(e) => handleInputChange("jodiPayout", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="harufPayout" className="text-gray-300">Haruf Payout Rate</Label>
                  <Input
                    id="harufPayout"
                    type="number"
                    step="0.1"
                    value={gameForm.harufPayout}
                    onChange={(e) => handleInputChange("harufPayout", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="crossingPayout" className="text-gray-300">Crossing Payout Rate</Label>
                  <Input
                    id="crossingPayout"
                    type="number"
                    step="0.1"
                    value={gameForm.crossingPayout}
                    onChange={(e) => handleInputChange("crossingPayout", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={gameForm.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="w-4 h-4 text-yellow-500 bg-gray-800 border-gray-600 rounded focus:ring-yellow-500"
              />
              <Label htmlFor="isActive" className="text-gray-300">
                Activate game immediately
              </Label>
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/game-management")}
                className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Game
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateGame;
