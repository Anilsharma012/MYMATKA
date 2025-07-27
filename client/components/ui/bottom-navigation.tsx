import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, Trophy, Headphones, Share } from "lucide-react";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/dashboard",
    },
    {
      id: "chart",
      label: "Chart",
      icon: BarChart3,
      path: "/charts",
    },
    {
      id: "matches",
      label: "My Matches",
      icon: Trophy,
      path: "/my-bets",
    },
    {
      id: "chat",
      label: "Chat & Call",
      icon: Headphones,
      path: "/support",
    },
    {
      id: "share",
      label: "Share & Earn",
      icon: Share,
      path: "/referral",
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 shadow-2xl">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                active
                  ? "text-matka-gold bg-matka-gold/10 transform scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon
                size={20}
                className={`mb-1 transition-all duration-300 ${
                  active ? "text-matka-gold drop-shadow-lg" : ""
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  active ? "text-matka-gold font-bold" : ""
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-matka-gold to-yellow-400 rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
