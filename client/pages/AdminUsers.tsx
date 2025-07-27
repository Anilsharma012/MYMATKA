import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Eye,
  UserCheck,
  UserX,
  Wallet,
  Plus,
} from "lucide-react";

interface User {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  isActive: boolean;
  createdAt: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  wallet: {
    balance: number;
    winningBalance: number;
    depositBalance: number;
    bonusBalance: number;
  };
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasPrev: false,
    hasNext: false,
  });
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addMoneyForm, setAddMoneyForm] = useState({
    amount: "",
    type: "deposit",
    description: "",
  });

  const navigate = useNavigate();

  // Check admin authentication on mount only
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      console.log("❌ AdminUsers: No token/user, redirecting to login");
      navigate("/admin/login");
      return;
    }

    console.log("✅ AdminUsers: Component mounted, fetching users...");
    // Force immediate fetch
    setTimeout(() => fetchUsers(true), 100);
  }, []); // Empty dependency array - only run once

  // Handle search with debouncing but no automatic refetch
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        // Don't auto-fetch here, let user trigger manually
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchUsers = async (manual = false) => {
    if (loading && !manual) {
      console.log("Already loading, skipping fetch");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.error("❌ No admin token found");
        navigate("/admin/login");
        return;
      }

      console.log("🔍 AdminUsers: Starting fetch...");
      console.log("🔍 AdminUsers: Token present:", !!token);
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        search: searchTerm,
        status: statusFilter,
      });

      const fetchUrl = `${BASE_URL}/api/admin/users?${params}`;
      console.log("🔍 AdminUsers: Fetching from URL:", fetchUrl);
      console.log("🔍 AdminUsers: BASE_URL:", BASE_URL);
      console.log("🔍 AdminUsers: Params:", params.toString());

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("🔍 AdminUsers: Request timeout - aborting");
        controller.abort();
      }, 10000);

      // Runtime validation to prevent localhost URLs in production
      const hostname = window.location.hostname;
      const isProduction = hostname.includes('.fly.dev') || !hostname.includes('localhost');
      let finalUrl = fetchUrl;

      if (isProduction && BASE_URL.includes('localhost')) {
        console.error('❌ CRITICAL: Localhost URL detected in production environment!');
        console.error('   Hostname:', hostname);
        console.error('   BASE_URL:', BASE_URL);
        console.error('   Forcing same-origin...');
        // Use same-origin requests for production
        finalUrl = `/api/admin/users?${params}`;
        console.log('🔧 Using corrected URL:', finalUrl);
      }

      console.log("🔍 AdminUsers: Making fetch request to:", finalUrl);
      const response = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🔍 AdminUsers: Response received, status:", response.status);
      console.log("🔍 AdminUsers: Response OK:", response.ok);

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
      console.log("Users data received:", data);

      if (data.success && data.data) {
        setUsers(data.data.users || []);
        setPagination(
          data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalUsers: 0,
            hasPrev: false,
            hasNext: false,
          },
        );
      } else {
        console.error("Invalid response structure:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("Request timed out");
      } else if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be running");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh users list
        fetchUsers();
      } else {
        alert(`Failed to update user status: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const handleAddMoney = (userId: string) => {
    setSelectedUserId(userId);
    setAddMoneyForm({
      amount: "",
      type: "deposit",
      description: "",
    });
    setShowAddMoneyModal(true);
  };

  const submitAddMoney = () => {
    if (addMoneyForm.amount && parseFloat(addMoneyForm.amount) > 0) {
      addMoneyToUser(
        selectedUserId,
        parseFloat(addMoneyForm.amount),
        addMoneyForm.type,
        addMoneyForm.description,
      );
      setShowAddMoneyModal(false);
    } else {
      alert("Please enter a valid amount");
    }
  };

  const addMoneyToUser = async (
    userId: string,
    amount: number,
    type: string,
    description: string,
  ) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}/add-money`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, type, description }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Money added successfully!");
        fetchUsers(true);
      } else {
        alert(`Failed to add money: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding money:", error);
      alert("Failed to add money");
    }
  };

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/dashboard")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">
              User Management
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] bg-input border-border text-foreground">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="inactive">Inactive Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Users ({pagination.totalUsers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No users found matching your criteria"
                    : "No users found in the database"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    onClick={() => fetchUsers(true)}
                    variant="outline"
                    className="mt-4 border-border text-foreground hover:bg-muted"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">User</TableHead>
                      <TableHead className="text-foreground">Contact</TableHead>
                      <TableHead className="text-foreground">
                        Wallet Balance
                      </TableHead>
                      <TableHead className="text-foreground">
                        Total Activity
                      </TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">
                        Joined Date
                      </TableHead>
                      <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">
                              {user.fullName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              ID: {user._id.slice(-8)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground text-sm">
                              {user.email}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {user.mobile}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground font-semibold">
                              ₹{user.wallet.balance.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              W: ₹{user.wallet.winningBalance} | D: ₹
                              {user.wallet.depositBalance} | B: ₹
                              {user.wallet.bonusBalance}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-green-500">
                              Deposits: ₹{user.totalDeposits.toLocaleString()}
                            </p>
                            <p className="text-red-500">
                              Withdrawals: ₹
                              {user.totalWithdrawals.toLocaleString()}
                            </p>
                            <p className="text-blue-500">
                              Bets: ₹{user.totalBets.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-muted-foreground text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/admin/users/${user._id}`)
                              }
                              className="border-border text-foreground hover:bg-muted"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMoney(user._id)}
                              className="border-border text-foreground hover:bg-muted"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toggleUserStatus(user._id, user.isActive)
                              }
                              className={`border-border hover:bg-muted ${
                                user.isActive
                                  ? "text-red-500"
                                  : "text-green-500"
                              }`}
                            >
                              {user.isActive ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

      {/* Add Money Modal */}
      <Dialog open={showAddMoneyModal} onOpenChange={setShowAddMoneyModal}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Add Money to User
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-foreground">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={addMoneyForm.amount}
                onChange={(e) =>
                  setAddMoneyForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-foreground">
                Type
              </Label>
              <Select
                value={addMoneyForm.type}
                onValueChange={(value) =>
                  setAddMoneyForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-3 bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="winning">Winning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="description"
                className="text-right text-foreground"
              >
                Description
              </Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={addMoneyForm.description}
                onChange={(e) =>
                  setAddMoneyForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="col-span-3 bg-input border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddMoneyModal(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitAddMoney}
              className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
            >
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
