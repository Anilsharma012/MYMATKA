import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
  };
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "commission";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  gameId?: string;
  gameName?: string;
  referenceId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  adminNotes?: string;
  processedBy?: {
    _id: string;
    fullName: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasPrev: false,
    hasNext: false,
  });

  const navigate = useNavigate();

  // Check admin authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.error("No admin token found");
        navigate("/admin/login");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`${BASE_URL}/api/admin/transactions?${params}`, {
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
      setTransactions(data.data.transactions);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be running");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.currentPage, typeFilter, statusFilter]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-500";
      case "withdrawal":
        return "text-red-500";
      case "bet":
        return "text-blue-500";
      case "win":
        return "text-matka-gold";
      case "bonus":
        return "text-purple-500";
      case "commission":
        return "text-orange-500";
      default:
        return "text-foreground";
    }
  };

  const formatAmount = (amount: number) => {
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
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
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
              onClick={() => navigate("/admin/dashboard")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Transaction Management
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user, reference ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-input border-border text-foreground"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="bet">Bet</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Transactions ({pagination.totalTransactions})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {transaction.userId?.fullName || "N/A"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {transaction.userId?.mobile || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`capitalize font-medium ${getTypeColor(
                            transaction.type,
                          )}`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-foreground font-medium">
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`capitalize font-medium ${getStatusColor(
                            transaction.status,
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-muted-foreground text-sm">
                          {transaction.description}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-muted-foreground text-sm">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-matka-gold"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === "pending" &&
                            transaction.type === "withdrawal" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-500 hover:text-green-400"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  className="border-border text-foreground hover:bg-muted"
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm py-2 px-4">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  className="border-border text-foreground hover:bg-muted"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTransactions;
