import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Wallet } from "lucide-react";

const GamesHub = () => {
  const navigate = useNavigate();

  const matkaNumbers = [22, 31, 30, 38, 29, 37, 36, 45, 44, 43, 50];

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-lg">⚪</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 bg-matka-dark rounded-full"></div>
            </div>
          </div>

          <div className="w-16 h-16 bg-gradient-to-br from-matka-gold via-yellow-500 to-matka-gold-dark rounded-full flex items-center justify-center border-4 border-matka-gold/30">
            <span className="text-2xl">🏺</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-matka-dark/50 px-3 py-2 rounded-lg">
              <Wallet className="h-4 w-4 text-matka-gold" />
              <span className="text-foreground font-semibold">₹0</span>
            </div>
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Promotional Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 border-0 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">LD'S</h3>
                <h3 className="text-2xl font-bold mb-1">GAME</h3>
                <p className="text-white/80 text-sm">worthy</p>
              </div>
              <div className="absolute right-4 top-4">
                <div className="w-16 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-white text-xs">
                www.dmatka.com
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl"></div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-6">
              <h3 className="text-3xl font-bold text-matka-gold mb-2">
                Dmatka
              </h3>
              <h3 className="text-2xl font-bold text-blue-300 mb-1">Colour</h3>
              <p className="text-white text-sm mb-2">खेलिए और देखिए</p>
              <p className="text-white text-sm">में अपना पैसा</p>
              <p className="text-white text-sm">कीजिए ।</p>
              <div className="mt-2">
                <span className="text-red-400 font-bold text-lg">खेलो और</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Games Section */}
        <h2 className="text-foreground text-xl font-bold mb-4">Live Games</h2>

        {/* Matka Game Card */}
        <Card className="bg-gradient-to-r from-matka-gold to-yellow-500 border-0 mb-4 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-bold text-matka-dark mb-1">
                  MATKA
                </h3>
                <p className="text-matka-dark/70 text-lg">GAME</p>
              </div>
              <div className="absolute top-4 right-4 text-matka-dark/20">
                <span className="text-2xl">✨</span>
              </div>
            </div>

            {/* Scattered Numbers */}
            <div className="absolute inset-0 overflow-hidden">
              {matkaNumbers.map((number, index) => (
                <div
                  key={index}
                  className="absolute text-matka-dark font-bold text-lg"
                  style={{
                    top: `${20 + ((index * 15) % 50)}%`,
                    right: `${10 + ((index * 20) % 60)}%`,
                    transform: `rotate(${(index * 15) % 45}deg)`,
                  }}
                >
                  {number}
                </div>
              ))}
            </div>

            {/* Pot Icon */}
            <div className="absolute bottom-4 right-6 w-16 h-16 bg-matka-dark/10 rounded-full flex items-center justify-center">
              <span className="text-3xl opacity-50">🏺</span>
            </div>
          </CardContent>
        </Card>

        {/* Colour Game Card */}
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 border-0 mb-6">
          <CardContent className="p-6 relative overflow-hidden">
            <h3 className="text-4xl font-bold text-white mb-1">COLOUR</h3>
            <p className="text-white/80 text-lg">GAME</p>

            {/* Color Circles */}
            <div className="absolute top-4 right-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full opacity-80"></div>
            </div>
            <div className="absolute bottom-4 right-16">
              <div className="w-12 h-12 bg-blue-400 rounded-full opacity-80"></div>
            </div>
            <div className="absolute bottom-4 right-4">
              <div className="w-14 h-14 bg-red-400 rounded-full opacity-80"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamesHub;
