import "./global.css";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LayoutWithNav from "@/components/ui/layout-with-nav";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MatkaGames from "./pages/MatkaGames";
import GamesHub from "./pages/GamesHub";
import Charts from "./pages/Charts";
import Wallet from "./pages/Wallet";
import AddMoney from "./pages/AddMoney";
import Withdraw from "./pages/Withdraw";
import CompanyDetails from "./pages/CompanyDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminTransactions from "./pages/AdminTransactions";
import AdminBets from "./pages/AdminBets";
import AdminPaymentGateway from "./pages/AdminPaymentGateway";
import AdminPaymentRequests from "./pages/AdminPaymentRequests";
import AdminResults from "./pages/AdminResults";
import AdminSupportTickets from "./pages/AdminSupportTickets";
import Support from "./pages/Support";
import BettingHistory from "./pages/BettingHistory";
import Games from "./pages/Games";
import GamePlay from "./pages/GamePlay";
import GameResults from "./pages/GameResults";
import MyBets from "./pages/MyBets";
import AdminGameResults from "./pages/AdminGameResults";
import AdminGameManagement from "./pages/AdminGameManagement";
import AdminCreateGame from "./pages/AdminCreateGame";
import AdminPayoutManagement from "./pages/AdminPayoutManagement";
import AdminResultManagement from "./pages/AdminResultManagement";
import AdminManagement from "./pages/AdminManagement";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import AdminTesting from "./pages/AdminTesting";
import TestResultDeclaration from "./pages/TestResultDeclaration";
import Referral from "./pages/Referral";
import ApiTest from "./pages/ApiTest";
import NotFound from "./pages/NotFound";
import AdminUserCredit from "./pages/AdminUserCredit";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <LayoutWithNav>{children}</LayoutWithNav>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const adminToken = localStorage.getItem("admin_token");
  const adminUser = localStorage.getItem("admin_user");

  if (!adminToken || !adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <PublicRoute>
          <Welcome />
        </PublicRoute>
      }
    />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/matka-games"
      element={
        <ProtectedRoute>
          <MatkaGames />
        </ProtectedRoute>
      }
    />
    <Route
      path="/games-hub"
      element={
        <ProtectedRoute>
          <GamesHub />
        </ProtectedRoute>
      }
    />

    <Route
      path="/charts"
      element={
        <ProtectedRoute>
          <Charts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/wallet"
      element={
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      }
    />
    <Route
      path="/add-money"
      element={
        <ProtectedRoute>
          <AddMoney />
        </ProtectedRoute>
      }
    />
    <Route
      path="/withdraw"
      element={
        <ProtectedRoute>
          <Withdraw />
        </ProtectedRoute>
      }
    />
    <Route
      path="/company/:gameName"
      element={
        <ProtectedRoute>
          <CompanyDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="/support"
      element={
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      }
    />
    <Route
      path="/betting-history"
      element={
        <ProtectedRoute>
          <BettingHistory />
        </ProtectedRoute>
      }
    />
    <Route
      path="/games"
      element={
        <ProtectedRoute>
          <Games />
        </ProtectedRoute>
      }
    />
    <Route
      path="/game/:gameId"
      element={
        <ProtectedRoute>
          <GamePlay />
        </ProtectedRoute>
      }
    />
    <Route
      path="/my-bets"
      element={
        <ProtectedRoute>
          <MyBets />
        </ProtectedRoute>
      }
    />
    <Route
      path="/game-results/:gameId"
      element={
        <ProtectedRoute>
          <GameResults />
        </ProtectedRoute>
      }
    />
    <Route
      path="/referral"
      element={
        <ProtectedRoute>
          <Referral />
        </ProtectedRoute>
      }
    />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/api-test" element={<ApiTest />} />
    <Route
      path="/admin/dashboard"
      element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <AdminProtectedRoute>
          <AdminUsers />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/users/:userId"
      element={
        <AdminProtectedRoute>
          <AdminUserDetail />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/withdrawals"
      element={
        <AdminProtectedRoute>
          <AdminWithdrawals />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/transactions"
      element={
        <AdminProtectedRoute>
          <AdminTransactions />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/bets"
      element={
        <AdminProtectedRoute>
          <AdminBets />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/payment-gateways"
      element={
        <AdminProtectedRoute>
          <AdminPaymentGateway />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/payment-requests"
      element={
        <AdminProtectedRoute>
          <AdminPaymentRequests />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/results"
      element={
        <AdminProtectedRoute>
          <AdminResults />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/game-results"
      element={
        <AdminProtectedRoute>
          <AdminGameResults />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/create-game"
      element={
        <AdminProtectedRoute>
          <AdminCreateGame />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/game-management"
      element={
        <AdminProtectedRoute>
          <AdminGameManagement />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/payout-management"
      element={
        <AdminProtectedRoute>
          <AdminPayoutManagement />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/result-management"
      element={
        <AdminProtectedRoute>
          <AdminResultManagement />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/management"
      element={
        <AdminProtectedRoute>
          <AdminManagement />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <AdminProtectedRoute>
          <AdminSettings />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <AdminProtectedRoute>
          <AdminReports />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/testing"
      element={
        <AdminProtectedRoute>
          <AdminTesting />
        </AdminProtectedRoute>
      }
    />
    <Route
      path="/admin/support"
      element={
        <AdminProtectedRoute>
          <AdminSupportTickets />
        </AdminProtectedRoute>
      }
    />
    <Route path="/test-result" element={<TestResultDeclaration />} />
    <Route
      path="/admin/user-credit"
      element={
        <AdminProtectedRoute>
          <AdminUserCredit />
        </AdminProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="dark">
            <AppRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
