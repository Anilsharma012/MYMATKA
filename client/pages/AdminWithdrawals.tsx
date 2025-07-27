import { useState, useEffect } from "react";
import BASE_URL from "../src/config";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  DollarSign,
  Eye,
} from "lucide-react";

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
  };
  amount: number;
  status: "pending" | "completed" | "rejected";
  description: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  adminNotes?: string;
  processedBy?: {
    fullName: string;
  };
  processedAt?: string;
  createdAt: string;
  balanceAfter: number;
}

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Transaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchWithdrawals();
  }, [navigate, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
     const url =
  statusFilter === "all"
    ? `${BASE_URL}/api/admin/transactions?type=withdrawal&limit=50`
    : `${BASE_URL}/api/admin/transactions?type=withdrawal&status=${statusFilter}&limit=50`;


      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      if (data.success) {
        setWithdrawals(data.data.transactions);

        // Calculate stats
        const allWithdrawals = data.data.transactions;
        const stats = {
          total: allWithdrawals.length,
          pending: allWithdrawals.filter(
            (w: Transaction) => w.status === "pending",
          ).length,
          approved: allWithdrawals.filter(
            (w: Transaction) => w.status === "completed",
          ).length,
          rejected: allWithdrawals.filter(
            (w: Transaction) => w.status === "rejected",
          ).length,
          totalAmount: allWithdrawals
            .filter((w: Transaction) => w.status === "completed")
            .reduce((sum: number, w: Transaction) => sum + w.amount, 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    if (actionType === "reject" && !adminNotes.trim()) {
      alert("Please provide rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/transactions/${selectedWithdrawal._id}/process`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,
            adminNotes: adminNotes.trim(),
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowDialog(false);
        setSelectedWithdrawal(null);
        setAdminNotes("");
        fetchWithdrawals(); // Refresh the list
      } else {
        alert(data.message || `Failed to ${actionType} withdrawal`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing withdrawal:`, error);
      alert(`Failed to ${actionType} withdrawal`);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewWithdrawal = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNotes(withdrawal.adminNotes || "");
    setActionType("approve");
    setShowDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && withdrawals.length === 0) {
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
            <h1 className="text-2xl font-bold text-white">
              Withdrawal Management
            </h1>
          </div>
          <Button
            onClick={fetchWithdrawals}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.pending}
                </p>
                <p className="text-sm text-yellow-300">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {stats.approved}
                </p>
                <p className="text-sm text-green-300">Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {stats.rejected}
                </p>
                <p className="text-sm text-red-300">Rejected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  ₹{stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-sm text-blue-300">Total Approved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-gray-300">Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-[#1a1a1a] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Withdrawals</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="completed">Approved Only</SelectItem>
                  <SelectItem value="rejected">Rejected Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals List */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Withdrawal Requests ({withdrawals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No withdrawal requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <Card
                    key={withdrawal._id}
                    className="bg-[#1a1a1a] border-gray-600"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <Badge
                              className={getStatusColor(withdrawal.status)}
                            >
                              {withdrawal.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {formatDate(withdrawal.createdAt)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-white font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {withdrawal.userId.fullName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {withdrawal.userId.mobile} •{" "}
                                {withdrawal.userId.email}
                              </p>
                            </div>

                            <div>
                              <p className="text-white font-semibold">
                                ₹{withdrawal.amount.toLocaleString()}
                              </p>
                              {withdrawal.bankDetails && (
                                <div className="text-gray-400 text-sm">
                                  <p>{withdrawal.bankDetails.bankName}</p>
                                  <p>
                                    A/C: {withdrawal.bankDetails.accountNumber}
                                  </p>
                                  <p>IFSC: {withdrawal.bankDetails.ifscCode}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewWithdrawal(withdrawal)}
                                className="text-gray-300 border-gray-600 hover:bg-gray-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {withdrawal.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setActionType("approve");
                                      setAdminNotes("");
                                      setShowDialog(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setActionType("reject");
                                      setAdminNotes("");
                                      setShowDialog(true);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {withdrawal.status !== "pending" &&
                            withdrawal.processedBy && (
                              <div className="mt-2 text-sm text-gray-400">
                                {withdrawal.status === "completed"
                                  ? "Approved"
                                  : "Rejected"}{" "}
                                by {withdrawal.processedBy.fullName}
                                {withdrawal.processedAt &&
                                  ` on ${formatDate(withdrawal.processedAt)}`}
                              </div>
                            )}

                          {withdrawal.adminNotes && (
                            <div className="mt-3 p-2 bg-gray-800 rounded">
                              <p className="text-gray-300 text-sm">
                                <strong>Admin Notes:</strong>{" "}
                                {withdrawal.adminNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Withdrawal Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[600px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {actionType === "approve" ? "Approve" : "Reject"} Withdrawal
              </DialogTitle>
            </DialogHeader>
            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">User</Label>
                    <p className="text-white">
                      {selectedWithdrawal.userId.fullName}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {selectedWithdrawal.userId.mobile}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Amount</Label>
                    <p className="text-white text-xl font-bold">
                      ₹{selectedWithdrawal.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedWithdrawal.bankDetails && (
                  <div>
                    <Label className="text-gray-300">Bank Details</Label>
                    <div className="bg-gray-800 p-3 rounded mt-2 text-sm">
                      <p className="text-white">
                        <strong>Bank:</strong>{" "}
                        {selectedWithdrawal.bankDetails.bankName}
                      </p>
                      <p className="text-white">
                        <strong>Account:</strong>{" "}
                        {selectedWithdrawal.bankDetails.accountNumber}
                      </p>
                      <p className="text-white">
                        <strong>IFSC:</strong>{" "}
                        {selectedWithdrawal.bankDetails.ifscCode}
                      </p>
                      <p className="text-white">
                        <strong>Name:</strong>{" "}
                        {selectedWithdrawal.bankDetails.accountHolderName}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="adminNotes" className="text-gray-300">
                    Admin Notes{" "}
                    {actionType === "reject" && "(Required for rejection)"}
                  </Label>
                  <Textarea
                    id="adminNotes"
                    placeholder={
                      actionType === "approve"
                        ? "Optional notes for approval..."
                        : "Reason for rejection..."
                    }
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                    rows={3}
                    disabled={selectedWithdrawal.status !== "pending"}
                  />
                </div>

                {selectedWithdrawal.status === "pending" && (
                  <DialogFooter className="gap-2">
                    <Button
                      onClick={() => handleProcessWithdrawal()}
                      disabled={
                        processing ||
                        (actionType === "reject" && !adminNotes.trim())
                      }
                      className={
                        actionType === "approve"
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing
                        ? "Processing..."
                        : actionType === "approve"
                          ? "Approve Withdrawal"
                          : "Reject Withdrawal"}
                    </Button>
                  </DialogFooter>
                )}

                {selectedWithdrawal.status !== "pending" && (
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-gray-300">
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          selectedWithdrawal.status === "completed"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {selectedWithdrawal.status.toUpperCase()}
                      </span>
                    </p>
                    {selectedWithdrawal.adminNotes && (
                      <p className="text-gray-300 mt-2">
                        <strong>Admin Notes:</strong>{" "}
                        {selectedWithdrawal.adminNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
