import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BASE_URL from "../src/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  RefreshCw,
  UserPlus,
  Shield,
  Settings,
  Eye,
  Edit,
  Trash2,
  Key,
  Activity,
  Users,
  Crown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Admin {
  _id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: "super_admin" | "admin" | "moderator";
  status: "active" | "inactive" | "suspended";
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminActivity {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const AdminManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State Management
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [activeTab, setActiveTab] = useState("admins");

  // Form States
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    role: "admin" as "super_admin" | "admin" | "moderator",
    permissions: [] as string[],
  });

  // Statistics
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    superAdmins: 0,
    totalActivities: 0,
  });

  const availablePermissions = [
    "users_view",
    "users_edit",
    "users_delete",
    "games_view",
    "games_edit",
    "games_create",
    "games_delete",
    "transactions_view",
    "transactions_edit",
    "results_declare",
    "reports_view",
    "reports_export",
    "settings_view",
    "settings_edit",
    "admin_management",
  ];

  const rolePermissions = {
    super_admin: availablePermissions,
    admin: [
      "users_view",
      "users_edit",
      "games_view",
      "games_edit",
      "transactions_view",
      "results_declare",
      "reports_view",
    ],
    moderator: [
      "users_view",
      "games_view",
      "transactions_view",
      "reports_view",
    ],
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      // Fetch admins and activities with proper error handling
      const [adminsResponse, activitiesResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/management/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${BASE_URL}/api/admin/management/activities`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      // Handle admins response
      if (adminsResponse && adminsResponse.ok) {
        try {
          const contentType = adminsResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const adminsData = await adminsResponse.json();
            setAdmins(adminsData.data || getMockAdmins());
            calculateStats(adminsData.data || getMockAdmins());
          } else {
            // Response is not JSON, use mock data
            console.log(
              "Admins API returned non-JSON response, using mock data",
            );
            setAdmins(getMockAdmins());
            calculateStats(getMockAdmins());
          }
        } catch (parseError) {
          console.log("Failed to parse admins response, using mock data");
          setAdmins(getMockAdmins());
          calculateStats(getMockAdmins());
        }
      } else {
        console.log("Admins API not available, using mock data");
        setAdmins(getMockAdmins());
        calculateStats(getMockAdmins());
      }

      // Handle activities response
      if (activitiesResponse && activitiesResponse.ok) {
        try {
          const contentType = activitiesResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const activitiesData = await activitiesResponse.json();
            setActivities(activitiesData.data || getMockActivities());
          } else {
            console.log(
              "Activities API returned non-JSON response, using mock data",
            );
            setActivities(getMockActivities());
          }
        } catch (parseError) {
          console.log("Failed to parse activities response, using mock data");
          setActivities(getMockActivities());
        }
      } else {
        console.log("Activities API not available, using mock data");
        setActivities(getMockActivities());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Use mock data as fallback
      setAdmins(getMockAdmins());
      setActivities(getMockActivities());
      calculateStats(getMockAdmins());
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (adminsData: Admin[]) => {
    setStats({
      totalAdmins: adminsData.length,
      activeAdmins: adminsData.filter((admin) => admin.status === "active")
        .length,
      superAdmins: adminsData.filter((admin) => admin.role === "super_admin")
        .length,
      totalActivities: activities.length,
    });
  };

  const getMockAdmins = (): Admin[] => [
    {
      _id: "1",
      fullName: "Super Admin",
      email: "superadmin@matka.com",
      mobile: "8888888888",
      role: "super_admin",
      status: "active",
      permissions: availablePermissions,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "2",
      fullName: "Game Admin",
      email: "gameadmin@matka.com",
      mobile: "9999999999",
      role: "admin",
      status: "active",
      permissions: rolePermissions.admin,
      lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: "3",
      fullName: "Content Moderator",
      email: "moderator@matka.com",
      mobile: "7777777777",
      role: "moderator",
      status: "active",
      permissions: rolePermissions.moderator,
      lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  const getMockActivities = (): AdminActivity[] => [
    {
      _id: "1",
      adminId: "1",
      adminName: "Super Admin",
      action: "admin_created",
      description: "Created new admin account for gameadmin@matka.com",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: "2",
      adminId: "2",
      adminName: "Game Admin",
      action: "game_result_declared",
      description: "Declared result for Delhi Bazar - 56",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0...",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      _id: "3",
      adminId: "1",
      adminName: "Super Admin",
      action: "settings_updated",
      description: "Updated platform commission rate to 5%",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  ];

  const handleCreateAdmin = async () => {
    console.log("🔥 handleCreateAdmin called with form data:", adminForm);

    if (creating) {
      console.log("🚫 Already creating, ignoring duplicate call");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("admin_token");
      console.log("🔑 Token:", token ? "Present" : "Missing");

      console.log("📤 Making POST request to create admin...");
      const response = await fetch(`${BASE_URL}/api/admin/management/admins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...adminForm,
          permissions: rolePermissions[adminForm.role],
        }),
      });

      console.log("📥 Response received:", response.status, response.statusText);

      if (response.ok) {
        // Success case - try to parse JSON safely
        try {
          const data = await response.json();
          console.log("Admin created successfully:", data);
        } catch (parseError) {
          console.log("Response was successful but no JSON data");
        }

        toast({
          title: "✅ Admin Created",
          description: `New admin ${adminForm.fullName} has been created successfully`,
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        // Error case - try to parse error message
        let errorMessage = "Unknown error occurred";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        toast({
          variant: "destructive",
          title: "Failed to Create Admin",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Admin creation network error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Create Admin",
        description: "Network error or server is not responding. Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/management/admins/${selectedAdmin._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(adminForm),
        },
      );

      // Parse JSON response once
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Admin Updated",
          description: `Admin ${adminForm.fullName} has been updated successfully`,
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setShowEditModal(false);
        setSelectedAdmin(null);
        resetForm();
        fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Update Admin",
          description: data.message || "Unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Admin update error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Update Admin",
        description: "Network error or server is not responding. Please try again.",
      });
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/management/admins/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAdmins((prev) => prev.filter((admin) => admin._id !== adminId));
        toast({
          title: "✅ Admin Deleted",
          description: "Admin has been deleted successfully",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        throw new Error("Failed to delete admin");
      }
    } catch (error) {
      console.error("Admin deletion error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Delete Admin",
        description: "Network error or server is not responding. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setAdminForm({
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      role: "admin",
      permissions: [],
    });
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setAdminForm({
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile || "",
      password: "",
      role: admin.role,
      permissions: admin.permissions,
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Moderator
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                Admin Management
              </h1>
              <p className="text-gray-400 text-sm">
                Manage administrators and their permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Admins</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalAdmins}
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
                  <p className="text-gray-400 text-sm">Active Admins</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.activeAdmins}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Super Admins</p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.superAdmins}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Recent Activities</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.totalActivities}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrators
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Administrators Tab */}
          <TabsContent value="admins">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Administrator Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Admin</TableHead>
                        <TableHead className="text-gray-300">Mobile</TableHead>
                        <TableHead className="text-gray-300">Role</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">
                          Last Login
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Permissions
                        </TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin._id} className="border-gray-700">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">
                                {admin.fullName}
                              </p>
                              <p className="text-sm text-gray-400">
                                {admin.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-gray-300 text-sm">
                              {admin.mobile || "Not provided"}
                            </p>
                          </TableCell>
                          <TableCell>{getRoleBadge(admin.role)}</TableCell>
                          <TableCell>{getStatusBadge(admin.status)}</TableCell>
                          <TableCell>
                            <p className="text-gray-300 text-sm">
                              {admin.lastLogin
                                ? new Date(admin.lastLogin).toLocaleDateString()
                                : "Never"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {admin.permissions.length} permissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(admin)}
                                className="border-gray-600 text-gray-300"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAdmin(admin._id)}
                                className="border-red-600 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activities">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Admin Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.action.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="text-gray-400 text-sm">
                              by {activity.adminName}
                            </span>
                          </div>
                          <p className="text-white">{activity.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>IP: {activity.ipAddress}</span>
                            <span>
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Admin Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Create New Administrator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  value={adminForm.fullName}
                  onChange={(e) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label className="text-gray-300">Mobile Number</Label>
                <Input
                  type="tel"
                  value={adminForm.mobile}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, mobile: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div>
                <Label className="text-gray-300">Password</Label>
                <Input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <Label className="text-gray-300">Role</Label>
                <Select
                  value={adminForm.role}
                  onValueChange={(value: any) =>
                    setAdminForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-800 p-3 rounded">
                <Label className="text-gray-300 text-sm">
                  Role Permissions Preview
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rolePermissions[adminForm.role].map((permission) => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="text-xs"
                    >
                      {permission.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={creating}
                className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Edit Administrator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  value={adminForm.fullName}
                  onChange={(e) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Mobile Number</Label>
                <Input
                  type="tel"
                  value={adminForm.mobile}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, mobile: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div>
                <Label className="text-gray-300">New Password (optional)</Label>
                <Input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div>
                <Label className="text-gray-300">Role</Label>
                <Select
                  value={adminForm.role}
                  onValueChange={(value: any) =>
                    setAdminForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditAdmin}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Update Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminManagement;
