import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Minus,
  History,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet as WalletIcon,
  DollarSign,
} from "lucide-react";

interface WalletData {
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalBets: number;
}

interface PaymentRequest {
  _id: string;
  gatewayId: {
    displayName: string;
    type: string;
  };
  amount: number;
  status: "pending" | "approved" | "rejected";
  referenceId: string;
  createdAt: string;
  transactionId?: string;
  adminNotes?: string;
}

interface WalletStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalBets: number;
  pendingDeposits: number;
  pendingCount: number;
  approvedDeposits: number;
  approvedCount: number;
}

const Wallet = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [depositHistory, setDepositHistory] = useState<PaymentRequest[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<PaymentRequest[]>(
    [],
  );
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    mountedRef.current = true;

    const initializeWallet = async () => {
      if (isMounted && !fetchingRef.current) {
        await fetchWalletData();
      }
    };

    initializeWallet();

    return () => {
      isMounted = false;
      mountedRef.current = false;
    };
  }, []);

  const fetchWalletData = useCallback(async () => {
    if (fetchingRef.current || !mountedRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      if (mountedRef.current) {
        setLoading(true);
      }
      const [
        walletResponse,
        depositResponse,
        withdrawalResponse,
        statsResponse,
      ] = await Promise.all([
        fetch(`${BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/wallet/deposit-history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/wallet/transactions?type=withdrawal&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/wallet/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (mountedRef.current) {
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletData(walletData.data);
        }

        if (depositResponse.ok) {
          const depositData = await depositResponse.json();
          setDepositHistory(depositData.data.deposits);
        }

        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalHistory(withdrawalData.data.transactions || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setWalletStats(statsData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    if (refreshing || fetchingRef.current) {
      return;
    }

    setRefreshing(true);
    await fetchWalletData();
    if (mountedRef.current) {
      setRefreshing(false);
    }
  }, [refreshing, fetchWalletData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500 bg-green-500/20";
      case "pending":
        return "text-yellow-500 bg-yellow-500/20";
      case "rejected":
        return "text-red-500 bg-red-500/20";
      default:
        return "text-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <h1 className="text-foreground text-xl font-bold">Wallet</h1>
            </div>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-5 w-5 text-foreground ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Total Balance Card */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-muted-foreground text-xl mb-4">
              Total Wallet Balance
            </h2>
            <div className="text-6xl font-bold text-foreground mb-4">
              ₹{walletData?.balance?.toLocaleString() || 0}
            </div>
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              <WalletIcon className="h-4 w-4" />
              100% Safe & Secure
            </div>
          </CardContent>
        </Card>

        {/* Exchange Winning Value Button */}
        <Button
          variant="outline"
          className="w-full mb-6 py-3 text-foreground border-border hover:bg-muted"
        >
          Exchange Winning Value
        </Button>

        {/* Balance Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500 mb-2">
                ₹{walletData?.winningBalance?.toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-sm">Winning Balance</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500 mb-2">
                ₹{walletData?.depositBalance?.toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-sm">Deposit Balance</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500 mb-2">
                ₹{walletData?.bonusBalance?.toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-sm">Bonus Balance</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500 mb-2">
                ₹{walletData?.commissionBalance?.toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-sm">Commission</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => navigate("/add-money")}
            className="flex-1 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            ADD
          </Button>
          <Button
            onClick={() => navigate("/withdraw")}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted py-3"
          >
            <Minus className="h-4 w-4 mr-2" />
            WITHDRAW
          </Button>
        </div>

        {/* Statistics and History */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Wallet Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/20">
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                >
                  Statistics
                </TabsTrigger>
                <TabsTrigger
                  value="deposits"
                  className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                >
                  Deposits
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawals"
                  className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                >
                  Withdrawals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                {walletStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/20 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">
                        Total Deposits
                      </p>
                      <p className="text-foreground text-xl font-bold">
                        ₹{walletStats.totalDeposits.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">
                        Total Winnings
                      </p>
                      <p className="text-green-500 text-xl font-bold">
                        ₹{walletStats.totalWinnings.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">
                        Pending Deposits
                      </p>
                      <p className="text-yellow-500 text-xl font-bold">
                        ₹{walletStats.pendingDeposits.toLocaleString()}
                      </p>
                      <p className="text-yellow-400 text-xs">
                        {walletStats.pendingCount} requests
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">
                        Total Bets
                      </p>
                      <p className="text-foreground text-xl font-bold">
                        ₹{walletStats.totalBets.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deposits" className="space-y-3">
                {depositHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No deposit history found
                    </p>
                    <Button
                      onClick={() => navigate("/add-money")}
                      className="mt-4 bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                    >
                      Make Your First Deposit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {depositHistory.map((request) => (
                      <div
                        key={request._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            ₹{request.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.gatewayId.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.referenceId}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${getStatusColor(request.status)} border-0`}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              <span className="capitalize">
                                {request.status}
                              </span>
                            </div>
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {depositHistory.length >= 10 && (
                      <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-muted"
                        onClick={() => navigate("/add-money")}
                      >
                        View All Deposit History
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-3">
                {withdrawalHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No withdrawal history found
                    </p>
                    <Button
                      onClick={() => navigate("/withdraw")}
                      className="mt-4 bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                    >
                      Make Your First Withdrawal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawalHistory.map((withdrawal: any) => (
                      <div
                        key={withdrawal._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            ₹{withdrawal.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.bankDetails?.bankName ||
                              "Bank Transfer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            A/C:{" "}
                            {withdrawal.bankDetails?.accountNumber?.replace(
                              /(.{4})/g,
                              "$1 ",
                            ) || "****"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${getStatusColor(withdrawal.status)} border-0`}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(withdrawal.status)}
                              <span className="capitalize">
                                {withdrawal.status === "completed"
                                  ? "approved"
                                  : withdrawal.status}
                              </span>
                            </div>
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(withdrawal.createdAt)}
                          </p>
                          {withdrawal.adminNotes && (
                            <p className="text-xs text-yellow-400 mt-1">
                              Note: {withdrawal.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {withdrawalHistory.length >= 10 && (
                      <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-muted"
                        onClick={() => navigate("/withdraw")}
                      >
                        View All Withdrawal History
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
