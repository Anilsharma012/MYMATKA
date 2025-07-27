import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Welcome = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-matka-dark relative overflow-hidden">
      {/* Pattern Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="relative">
            {/* Stars around logo */}
            <div className="absolute -top-8 -left-8 text-matka-gold text-lg">
              ⭐
            </div>
            <div className="absolute -top-6 -right-6 text-matka-gold text-sm">
              ⭐
            </div>
            <div className="absolute -bottom-6 -left-6 text-matka-gold text-sm">
              ⭐
            </div>
            <div className="absolute -bottom-8 -right-8 text-matka-gold text-lg">
              ⭐
            </div>
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-matka-gold text-base">
              ⭐
            </div>
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-matka-gold text-base">
              ⭐
            </div>
            <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 text-matka-gold text-base">
              ⭐
            </div>
            <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 text-matka-gold text-base">
              ⭐
            </div>

            {/* Pot Logo */}
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-matka-gold via-yellow-500 to-matka-gold-dark border-4 border-matka-gold shadow-2xl flex items-center justify-center">
                <div className="text-6xl">🏺</div>
              </div>
              {/* Ribbon */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-matka-dark px-4 py-1 rounded-full border-2 border-matka-gold">
                <span className="text-matka-gold font-bold text-sm tracking-wider">
                  MATKA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="mb-12">
          <h1 className="text-white text-3xl md:text-4xl font-light mb-2">
            Welcome to
          </h1>
          <h2 className="text-matka-gold text-4xl md:text-5xl font-bold tracking-wide">
            TheMatka App
          </h2>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-6 mb-12">
          {/* World's Best Game Badge */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark px-6 py-3 rounded-full font-bold text-sm">
                ⭐⭐⭐
              </div>
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-matka-gold to-yellow-500 rounded-full -z-10"></div>
              <div className="bg-matka-dark text-matka-gold px-4 py-2 rounded-full text-xs font-semibold mt-2 text-center">
                WORLD'S BEST GAME
              </div>
              {/* Ribbon tails */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-matka-gold"></div>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-matka-dark font-bold text-xs">100%</span>
              </div>
              <div className="text-matka-gold text-xs font-semibold mt-2 text-center">
                SECURE
              </div>
              <div className="text-matka-gold text-xs">⭐⭐⭐</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-matka-dark font-bold text-xs">100%</span>
              </div>
              <div className="text-matka-gold text-xs font-semibold mt-2 text-center">
                LEGAL
              </div>
              <div className="text-matka-gold text-xs">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>

        {/* Loading Spinner or Get Started Button */}
        <div className="flex justify-center">
          {loading ? (
            <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
          ) : (
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold px-8 py-3 rounded-full hover:from-yellow-500 hover:to-matka-gold transition-all duration-300 shadow-lg"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
