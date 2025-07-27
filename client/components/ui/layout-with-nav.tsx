import React from "react";
import BottomNavigation from "./bottom-navigation";

interface LayoutWithNavProps {
  children: React.ReactNode;
}

const LayoutWithNav: React.FC<LayoutWithNavProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Main content with bottom padding to account for fixed bottom nav */}
      <div className="pb-20">{children}</div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default LayoutWithNav;
