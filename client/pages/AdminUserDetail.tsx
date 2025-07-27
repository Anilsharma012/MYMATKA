import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Wallet,
  Activity,
  Settings,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface UserDetail {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  isActive: boolean;
  role: string;
  kycStatus: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWinnings: number;
  referralCode?: string;
  referredBy?: {
    _id: string;
    fullName: string;
    mobile: string;
  };
  referredUsers: any[];
  createdAt: string;
  lastLogin?: string;
  wallet: {
    balance: number;
    winningBalance: number;
    depositBalance: number;
    bonusBalance: number;
    commissionBalance: number;
  };
  recentTransactions: any[];
  recentBets: any[];
}

const AdminUserDetail = () => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userId } = useParams();

  // Check admin authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    if (userId) {
      fetchUserDetail();
    }
  }, [userId, navigate]);

  const fetchUserDetail = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.error("No admin token found");
        navigate("/admin/login");
        return;
      }

      console.log(`Fetching user detail for ID: ${userId}`);

      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          navigate("/admin/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("User detail data received:", data);

      if (data.success && data.data) {
        setUser({
          ...data.data.user,
          wallet: data.data.wallet || {
            balance: 0,
            winningBalance: 0,
            depositBalance: 0,
            bonusBalance: 0,
            commissionBalance: 0,
          },
          recentTransactions: data.data.recentTransactions || [],
          recentBets: data.data.recentBets || [],
        });
      } else {
        console.error("Invalid response structure:", data);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be running");
        // Retry once after 2 seconds
        if (retryCount < 1) {
          setTimeout(() => {
            console.log("Retrying to fetch user detail...");
            fetchUserDetail(retryCount + 1);
          }, 2000);
          return;
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser((prev) =>
          prev ? { ...prev, isActive: !prev.isActive } : null,
        );
      } else {
        alert(`Failed to update user status: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            User not found or failed to load
          </p>
          <div className="space-x-4">
            <Button
              onClick={() => {
                setLoading(true);
                fetchUserDetail();
              }}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/admin/users")}
              className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </div>
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
              onClick={() => navigate("/admin/users")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user.fullName}
              </h1>
              <p className="text-muted-foreground">ID: {user._id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={user.isActive ? "default" : "destructive"}
              className={user.isActive ? "bg-green-500" : "bg-red-500"}
            >
              {user.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              onClick={toggleUserStatus}
              variant="outline"
              className={`border-border hover:bg-muted ${
                user.isActive ? "text-red-500" : "text-green-500"
              }`}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>

        {/* User Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-matka-gold/20">
                  <Wallet className="h-6 w-6 text-matka-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(user.wallet?.balance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Deposits
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(user.totalDeposits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Withdrawals
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(user.totalWithdrawals || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(user.totalBets || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="text-foreground font-medium">
                        {user.fullName || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-foreground font-medium">
                        {user.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="text-foreground font-medium">
                        {user.mobile || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Joined Date
                      </p>
                      <p className="text-foreground font-medium">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Login
                        </p>
                        <p className="text-foreground font-medium">
                          {formatDate(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        user.kycStatus === "verified" ? "default" : "secondary"
                      }
                      className={
                        user.kycStatus === "verified"
                          ? "bg-green-500"
                          : user.kycStatus === "rejected"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }
                    >
                      KYC: {user.kycStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Wallet Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Winning Balance
                    </p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(user.wallet?.winningBalance || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Deposit Balance
                    </p>
                    <p className="text-xl font-bold text-blue-500">
                      {formatCurrency(user.wallet?.depositBalance || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Bonus Balance
                    </p>
                    <p className="text-xl font-bold text-purple-500">
                      {formatCurrency(user.wallet?.bonusBalance || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-xl font-bold text-orange-500">
                      {formatCurrency(user.wallet?.commissionBalance || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.recentTransactions?.length > 0 ? (
                    <div className="space-y-3">
                      {user.recentTransactions
                        .slice(0, 5)
                        .map((transaction: any) => (
                          <div
                            key={transaction._id}
                            className="flex justify-between items-center p-3 rounded-lg border border-border/50"
                          >
                            <div>
                              <p className="text-foreground font-medium">
                                {transaction.type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                            <p
                              className={`font-bold ${transaction.type === "deposit" ? "text-green-500" : "text-red-500"}`}
                            >
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No transactions found
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  {user.recentBets?.length > 0 ? (
                    <div className="space-y-3">
                      {user.recentBets.slice(0, 5).map((bet: any) => (
                        <div
                          key={bet._id}
                          className="flex justify-between items-center p-3 rounded-lg border border-border/50"
                        >
                          <div>
                            <p className="text-foreground font-medium">
                              {bet.gameName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(bet.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {formatCurrency(bet.amount)}
                            </p>
                            <p
                              className={`text-sm ${bet.status === "won" ? "text-green-500" : bet.status === "lost" ? "text-red-500" : "text-yellow-500"}`}
                            >
                              {bet.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No bets found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">
                        Account Status
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable user account
                      </p>
                    </div>
                    <Button
                      onClick={toggleUserStatus}
                      variant={user.isActive ? "destructive" : "default"}
                      className={
                        user.isActive ? "" : "bg-green-500 hover:bg-green-600"
                      }
                    >
                      {user.isActive
                        ? "Deactivate Account"
                        : "Activate Account"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">
                        Reset Password
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Send password reset link to user
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      Send Reset Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminUserDetail;
