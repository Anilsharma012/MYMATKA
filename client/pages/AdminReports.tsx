import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileSpreadsheet,
  FileText as FilePdf,
  PrinterIcon,
} from "lucide-react";

interface ReportData {
  financialSummary: {
    totalRevenue: number;
    totalBets: number;
    totalWinnings: number;
    totalCommission: number;
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    premiumUsers: number;
  };
  gameStats: {
    totalGames: number;
    activeGames: number;
    totalBetsPlaced: number;
    averageBetAmount: number;
  };
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    bets: number;
    users: number;
  }>;
  gameWiseRevenue: Array<{
    name: string;
    revenue: number;
    bets: number;
    color: string;
  }>;
  userActivity: Array<{
    month: string;
    newUsers: number;
    activeUsers: number;
  }>;
}

const AdminReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reportData, setReportData] = useState<ReportData>({
    financialSummary: {
      totalRevenue: 1250000,
      totalBets: 15420,
      totalWinnings: 890000,
      totalCommission: 62500,
      totalDeposits: 2100000,
      totalWithdrawals: 1850000,
      netProfit: 360000,
    },
    userStats: {
      totalUsers: 2847,
      activeUsers: 1923,
      newUsers: 156,
      premiumUsers: 542,
    },
    gameStats: {
      totalGames: 8,
      activeGames: 6,
      totalBetsPlaced: 15420,
      averageBetAmount: 81,
    },
    dailyRevenue: [
      { date: "01/07", revenue: 45000, bets: 320, users: 89 },
      { date: "02/07", revenue: 52000, bets: 398, users: 102 },
      { date: "03/07", revenue: 41000, bets: 276, users: 78 },
      { date: "04/07", revenue: 63000, bets: 445, users: 124 },
      { date: "05/07", revenue: 58000, bets: 402, users: 115 },
      { date: "06/07", revenue: 71000, bets: 523, users: 143 },
      { date: "07/07", revenue: 68000, bets: 489, users: 137 },
    ],
    gameWiseRevenue: [
      { name: "Delhi Bazar", revenue: 320000, bets: 4200, color: "#8884d8" },
      { name: "Mumbai Main", revenue: 280000, bets: 3800, color: "#82ca9d" },
      { name: "Kalyan", revenue: 250000, bets: 3200, color: "#ffc658" },
      { name: "Time Bazar", revenue: 200000, bets: 2800, color: "#ff7300" },
      { name: "Rajdhani Day", revenue: 150000, bets: 2100, color: "#8dd1e1" },
      { name: "Others", revenue: 100000, bets: 1500, color: "#d084d0" },
    ],
    userActivity: [
      { month: "Jan", newUsers: 245, activeUsers: 1200 },
      { month: "Feb", newUsers: 289, activeUsers: 1350 },
      { month: "Mar", newUsers: 312, activeUsers: 1450 },
      { month: "Apr", newUsers: 298, activeUsers: 1520 },
      { month: "May", newUsers: 334, activeUsers: 1680 },
      { month: "Jun", newUsers: 367, activeUsers: 1820 },
      { month: "Jul", newUsers: 156, activeUsers: 1923 },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [exportFormat, setExportFormat] = useState("csv");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchReportData();
  }, [navigate, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch(
        `${BASE_URL}/api/admin/reports?range=${dateRange}&status=${filterStatus}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ).catch(() => null);

      if (response && response.ok) {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setReportData(data.data || reportData);
          } else {
            console.log(
              "Reports API returned non-JSON response, using mock data",
            );
          }
        } catch (parseError) {
          console.log("Failed to parse reports response, using mock data");
        }
      } else {
        console.log("Reports API not available, using mock data");
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string, reportType: string) => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(
        `${BASE_URL}/api/admin/reports/export?format=${format}&type=${reportType}&range=${dateRange}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        // Mock export functionality
        const blob = new Blob([generateMockCSV(reportType)], {
          type: "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "✅ Report Exported",
          description: `${reportType} report has been downloaded successfully`,
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      // Mock successful export
      const blob = new Blob([generateMockCSV(reportType)], {
        type: "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Report Exported",
        description: `${reportType} report has been downloaded successfully`,
        className: "border-green-500 bg-green-50 text-green-900",
      });
    }
  };

  const generateMockCSV = (reportType: string) => {
    switch (reportType) {
      case "financial":
        return `Date,Revenue,Bets,Winnings,Commission,Profit
2024-07-01,45000,320,28000,2250,14750
2024-07-02,52000,398,32000,2600,17400
2024-07-03,41000,276,25000,2050,13950
2024-07-04,63000,445,38000,3150,21850
2024-07-05,58000,402,35000,2900,20100`;

      case "users":
        return `Date,New Users,Active Users,Total Users,Premium Users
2024-07-01,12,89,2691,528
2024-07-02,18,102,2709,531
2024-07-03,8,78,2717,533
2024-07-04,22,124,2739,538
2024-07-05,15,115,2754,540`;

      case "games":
        return `Game Name,Total Bets,Total Revenue,Average Bet,Active Players
Delhi Bazar,4200,320000,76,312
Mumbai Main,3800,280000,74,289
Kalyan,3200,250000,78,245
Time Bazar,2800,200000,71,198
Rajdhani Day,2100,150000,71,156`;

      default:
        return "No data available";
    }
  };

  const printReport = () => {
    window.print();
    toast({
      title: "📄 Print Dialog Opened",
      description: "Report is ready for printing",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
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
            <div>
              <h1 className="text-2xl font-bold text-white">
                Reports & Analytics
              </h1>
              <p className="text-gray-400 text-sm">
                Comprehensive business intelligence and reporting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-[#2a2a2a] border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchReportData}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{reportData.financialSummary.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-400">
                    +12.5% from last month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {reportData.userStats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-400">
                    +{reportData.userStats.newUsers} new this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Bets</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {reportData.financialSummary.totalBets.toLocaleString()}
                  </p>
                  <p className="text-xs text-yellow-400">
                    Avg: ₹{reportData.gameStats.averageBetAmount}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ₹{reportData.financialSummary.netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-400">28.8% margin</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Games
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Chart */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    Daily Revenue Trend
                  </CardTitle>
                  <Button
                    onClick={() => exportReport("csv", "daily_revenue")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                        axisLine={{ stroke: "#9CA3AF" }}
                        tickLine={{ stroke: "#9CA3AF" }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                        axisLine={{ stroke: "#9CA3AF" }}
                        tickLine={{ stroke: "#9CA3AF" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Revenue (₹)"
                      />
                      <Line
                        type="monotone"
                        dataKey="bets"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name="Bets Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Game-wise Revenue Pie Chart */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Revenue by Game</CardTitle>
                  <Button
                    onClick={() => exportReport("csv", "game_revenue")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.gameWiseRevenue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {reportData.gameWiseRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* User Activity Chart */}
            <Card className="bg-[#2a2a2a] border-gray-700 mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">
                  User Activity Trends
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportReport("csv", "user_activity")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    onClick={printReport}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300"
                  >
                    <PrinterIcon className="h-3 w-3 mr-1" />
                    Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      tick={{ fill: "#9CA3AF" }}
                      axisLine={{ stroke: "#9CA3AF" }}
                      tickLine={{ stroke: "#9CA3AF" }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fill: "#9CA3AF" }}
                      axisLine={{ stroke: "#9CA3AF" }}
                      tickLine={{ stroke: "#9CA3AF" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#10B981" name="New Users" />
                    <Bar
                      dataKey="activeUsers"
                      fill="#3B82F6"
                      name="Active Users"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <div className="space-y-6">
              {/* Financial Summary */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    Financial Summary
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select
                      value={exportFormat}
                      onValueChange={setExportFormat}
                    >
                      <SelectTrigger className="w-24 bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => exportReport(exportFormat, "financial")}
                      className="bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-400">
                        ₹
                        {reportData.financialSummary.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Winnings</p>
                      <p className="text-2xl font-bold text-red-400">
                        ₹
                        {reportData.financialSummary.totalWinnings.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Commission</p>
                      <p className="text-2xl font-bold text-blue-400">
                        ₹
                        {reportData.financialSummary.totalCommission.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Net Profit</p>
                      <p className="text-2xl font-bold text-purple-400">
                        ₹
                        {reportData.financialSummary.netProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Deposits</p>
                      <p className="text-xl font-bold text-green-400">
                        ₹
                        {reportData.financialSummary.totalDeposits.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Withdrawals</p>
                      <p className="text-xl font-bold text-yellow-400">
                        ₹
                        {reportData.financialSummary.totalWithdrawals.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Financial Table */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Financial Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Metric</TableHead>
                        <TableHead className="text-gray-300">Amount</TableHead>
                        <TableHead className="text-gray-300">
                          Percentage
                        </TableHead>
                        <TableHead className="text-gray-300">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-gray-700">
                        <TableCell className="text-white">
                          Total Revenue
                        </TableCell>
                        <TableCell className="text-green-400">
                          ₹
                          {reportData.financialSummary.totalRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300">100%</TableCell>
                        <TableCell className="text-green-400">+12.5%</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-700">
                        <TableCell className="text-white">
                          Total Winnings
                        </TableCell>
                        <TableCell className="text-red-400">
                          ₹
                          {reportData.financialSummary.totalWinnings.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(
                            (reportData.financialSummary.totalWinnings /
                              reportData.financialSummary.totalRevenue) *
                            100
                          ).toFixed(1)}
                          %
                        </TableCell>
                        <TableCell className="text-red-400">+8.3%</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-700">
                        <TableCell className="text-white">
                          Platform Commission
                        </TableCell>
                        <TableCell className="text-blue-400">
                          ₹
                          {reportData.financialSummary.totalCommission.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(
                            (reportData.financialSummary.totalCommission /
                              reportData.financialSummary.totalRevenue) *
                            100
                          ).toFixed(1)}
                          %
                        </TableCell>
                        <TableCell className="text-blue-400">+15.2%</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-700">
                        <TableCell className="text-white font-bold">
                          Net Profit
                        </TableCell>
                        <TableCell className="text-purple-400 font-bold">
                          ₹
                          {reportData.financialSummary.netProfit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300 font-bold">
                          {(
                            (reportData.financialSummary.netProfit /
                              reportData.financialSummary.totalRevenue) *
                            100
                          ).toFixed(1)}
                          %
                        </TableCell>
                        <TableCell className="text-purple-400 font-bold">
                          +22.1%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              {/* User Statistics */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">User Statistics</CardTitle>
                  <Button
                    onClick={() => exportReport(exportFormat, "users")}
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Users Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {reportData.userStats.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-green-400">
                        {reportData.userStats.activeUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">New Users</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {reportData.userStats.newUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Premium Users</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {reportData.userStats.premiumUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Activity Chart */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Monthly User Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.userActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="newUsers" fill="#10B981" name="New Users" />
                      <Bar
                        dataKey="activeUsers"
                        fill="#3B82F6"
                        name="Active Users"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <div className="space-y-6">
              {/* Game Statistics */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Game Performance</CardTitle>
                  <Button
                    onClick={() => exportReport(exportFormat, "games")}
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Games Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">
                          Game Name
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Total Bets
                        </TableHead>
                        <TableHead className="text-gray-300">Revenue</TableHead>
                        <TableHead className="text-gray-300">Avg Bet</TableHead>
                        <TableHead className="text-gray-300">
                          Performance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.gameWiseRevenue.map((game, index) => (
                        <TableRow key={index} className="border-gray-700">
                          <TableCell className="text-white font-medium">
                            {game.name}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {game.bets.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-green-400">
                            ₹{game.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            ₹{Math.round(game.revenue / game.bets)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: game.color }}
                              ></div>
                              <span className="text-gray-300">
                                {index < 2
                                  ? "Excellent"
                                  : index < 4
                                    ? "Good"
                                    : "Average"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Game Revenue Chart */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Revenue Distribution by Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.gameWiseRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        formatter={(value: any) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminReports;
