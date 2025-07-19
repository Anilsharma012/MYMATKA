import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
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
  ArrowLeft,
  TrendingUp,
  Edit,
  Save,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  Trophy,
} from "lucide-react";

interface Game {
  _id: string;
  name: string;
  type: "jodi" | "haruf" | "crossing";
  description: string;
  jodiPayout: number;
  harufPayout: number;
  crossingPayout: number;
  isActive: boolean;
  currentStatus: string;
}

interface PayoutSettings {
  gameId: string;
  gameName: string;
  gameType: string;
  jodiPayout: number;
  harufPayout: number;
  crossingPayout: number;
}

const AdminPayoutManagement = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPayouts, setEditPayouts] = useState({
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchGames();
  }, [navigate]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${BASE_URL}/api/admin/games`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data.data.games || []);
      } else {
        console.error("Failed to fetch games:", response.status);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setEditPayouts({
      jodiPayout: game.jodiPayout,
      harufPayout: game.harufPayout,
      crossingPayout: game.crossingPayout,
    });
    setShowEditModal(true);
  };

  const handleSavePayouts = async () => {
    if (!selectedGame) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${BASE_URL}/api/admin/games/${selectedGame._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jodiPayout: editPayouts.jodiPayout,
          harufPayout: editPayouts.harufPayout,
          crossingPayout: editPayouts.crossingPayout,
        }),
      });

      if (response.ok) {
        alert(`✅ PAYOUT RATES UPDATED!

🎮 Game: ${selectedGame.name}
🎯 Jodi: ${editPayouts.jodiPayout}:1
⚡ Haruf: ${editPayouts.harufPayout}:1
🏆 Crossing: ${editPayouts.crossingPayout}:1

✅ Users will now see these new rates when betting!`);

        setShowEditModal(false);
        fetchGames(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(
          `❌ Failed to update payout rates: ${errorData.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error updating payout rates:", error);
      alert("❌ Network error: Failed to update payout rates");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    const confirm = window.confirm(`⚠️ BULK UPDATE CONFIRMATION

This will update ALL games with these payout rates:
🎯 Jodi: 95:1
⚡ Haruf: 9:1  
🏆 Crossing: 95:1

Are you sure you want to proceed?`);

    if (!confirm) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${BASE_URL}/api/admin/games/update-payouts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ BULK UPDATE SUCCESSFUL!

📊 Updated ${data.data.updatedCount} games
🎯 Jodi: 95:1
⚡ Haruf: 9:1
🏆 Crossing: 95:1

✅ All users will now see the new payout rates!`);

        fetchGames(); // Refresh the list
      } else {
        alert("❌ Failed to bulk update payout rates");
      }
    } catch (error) {
      console.error("Error bulk updating:", error);
      alert("❌ Network error: Failed to bulk update");
    } finally {
      setSaving(false);
    }
  };

  const getPayoutIcon = (type: string) => {
    switch (type) {
      case "jodi":
        return <Target className="h-4 w-4" />;
      case "haruf":
        return <Zap className="h-4 w-4" />;
      case "crossing":
        return <Trophy className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getPayoutColor = (type: string) => {
    switch (type) {
      case "jodi":
        return "text-blue-400";
      case "haruf":
        return "text-yellow-400";
      case "crossing":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payout settings...</p>
        </div>
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
              Payout Rate Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchGames}
              disabled={saving}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={saving}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Bulk Update (95:1, 9:1, 95:1)
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-600 border-blue-500 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-white" />
              <div className="text-white">
                <h3 className="font-semibold mb-1">Payout Rate Control</h3>
                <p className="text-sm text-blue-100">
                  Set custom payout ratios for each game. These rates will be
                  displayed to users and used for actual payouts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Payout Settings */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Payout Settings ({games.length} games)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No games found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <Card key={game._id} className="bg-[#1a1a1a] border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">
                            {game.name}
                          </h3>
                          <Badge
                            className={
                              game.isActive ? "bg-green-500" : "bg-red-500"
                            }
                          >
                            {game.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditGame(game)}
                          className="bg-yellow-500 text-black hover:bg-yellow-600"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPayoutIcon("jodi")}
                            <span className="text-gray-300 text-sm">Jodi</span>
                          </div>
                          <span className="text-blue-400 font-bold">
                            {game.jodiPayout}:1
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPayoutIcon("haruf")}
                            <span className="text-gray-300 text-sm">Haruf</span>
                          </div>
                          <span className="text-yellow-400 font-bold">
                            {game.harufPayout}:1
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPayoutIcon("crossing")}
                            <span className="text-gray-300 text-sm">
                              Crossing
                            </span>
                          </div>
                          <span className="text-purple-400 font-bold">
                            {game.crossingPayout}:1
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">
                        <p>Status: {game.currentStatus}</p>
                        <p>Type: {game.type.toUpperCase()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Payout Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Edit Payout Rates - {selectedGame?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedGame && (
              <div className="space-y-6">
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-300">
                    <strong>Game:</strong> {selectedGame.name}
                  </p>
                  <p className="text-gray-300">
                    <strong>Type:</strong> {selectedGame.type.toUpperCase()}
                  </p>
                  <p className="text-gray-300">
                    <strong>Status:</strong>{" "}
                    {selectedGame.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label
                      htmlFor="jodiPayout"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <Target className="h-4 w-4 text-blue-400" />
                      Jodi Payout Ratio (X:1)
                    </Label>
                    <Input
                      id="jodiPayout"
                      type="number"
                      value={editPayouts.jodiPayout}
                      onChange={(e) =>
                        setEditPayouts((prev) => ({
                          ...prev,
                          jodiPayout: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      min="1"
                      max="999"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {selectedGame.jodiPayout}:1 → New:{" "}
                      {editPayouts.jodiPayout}:1
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="harufPayout"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Haruf Payout Ratio (X:1)
                    </Label>
                    <Input
                      id="harufPayout"
                      type="number"
                      value={editPayouts.harufPayout}
                      onChange={(e) =>
                        setEditPayouts((prev) => ({
                          ...prev,
                          harufPayout: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      min="1"
                      max="999"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {selectedGame.harufPayout}:1 → New:{" "}
                      {editPayouts.harufPayout}:1
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="crossingPayout"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <Trophy className="h-4 w-4 text-purple-400" />
                      Crossing Payout Ratio (X:1)
                    </Label>
                    <Input
                      id="crossingPayout"
                      type="number"
                      value={editPayouts.crossingPayout}
                      onChange={(e) =>
                        setEditPayouts((prev) => ({
                          ...prev,
                          crossingPayout: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      min="1"
                      max="999"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {selectedGame.crossingPayout}:1 �� New:{" "}
                      {editPayouts.crossingPayout}:1
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded">
                  <p className="text-yellow-300 text-sm">
                    <strong>⚠️ Important:</strong> These payout rates will be
                    immediately visible to users and will be used for all new
                    bets placed after this update.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePayouts}
                disabled={saving}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Payout Rates
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPayoutManagement;
