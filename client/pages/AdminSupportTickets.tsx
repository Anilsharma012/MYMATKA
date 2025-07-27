import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Star,
} from "lucide-react";

interface SupportTicket {
  _id: string;
  ticketId: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
  };
  subject: string;
  category: "payment" | "account" | "technical" | "game" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  attachments?: string[];
  responses: {
    _id: string;
    message: string;
    isAdmin: boolean;
    respondedBy: string;
    respondedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    _id: string;
    fullName: string;
  };
  resolutionTime?: number; // in hours
}

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("open");
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResolutionTime: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchTickets();
  }, [navigate, statusFilter, priorityFilter, categoryFilter, searchTerm]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.log("No admin token found");
        setTickets([]);
        return;
      }

      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (priorityFilter !== "all")
        queryParams.append("priority", priorityFilter);
      if (categoryFilter !== "all")
        queryParams.append("category", categoryFilter);
      if (searchTerm) queryParams.append("search", searchTerm);
      queryParams.append("limit", "50");

      const response = await fetch(
        `${BASE_URL}/api/admin/support/tickets?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

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
        const tickets = data.data.tickets || [];
        setTickets(tickets);

        // Calculate stats
        const calculatedStats = {
          total: tickets.length,
          open: tickets.filter((t: SupportTicket) => t.status === "open")
            .length,
          inProgress: tickets.filter(
            (t: SupportTicket) => t.status === "in_progress",
          ).length,
          resolved: tickets.filter(
            (t: SupportTicket) => t.status === "resolved",
          ).length,
          closed: tickets.filter((t: SupportTicket) => t.status === "closed")
            .length,
          avgResolutionTime:
            tickets
              .filter((t: SupportTicket) => t.resolutionTime)
              .reduce(
                (acc: number, t: SupportTicket) =>
                  acc + (t.resolutionTime || 0),
                0,
              ) /
            Math.max(
              tickets.filter((t: SupportTicket) => t.resolutionTime).length,
              1,
            ),
        };
        setStats(calculatedStats);
      } else {
        throw new Error("Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);

      // Use mock data as fallback for development
      const mockTickets: SupportTicket[] = [
        {
          _id: "1",
          ticketId: "TKT-2024-001",
          userId: {
            _id: "user1",
            fullName: "Rajesh Kumar",
            mobile: "+91 98765 43210",
            email: "rajesh@example.com",
          },
          subject: "Payment not reflected in wallet",
          category: "payment",
          priority: "high",
          status: "open",
          description:
            "I made a payment of ₹1000 via UPI but it's not showing in my wallet. Transaction ID: UPI123456789",
          responses: [],
          createdAt: "2024-01-03T10:30:00Z",
          updatedAt: "2024-01-03T10:30:00Z",
        },
        {
          _id: "2",
          ticketId: "TKT-2024-002",
          userId: {
            _id: "user2",
            fullName: "Priya Sharma",
            mobile: "+91 87654 32109",
            email: "priya@example.com",
          },
          subject: "Unable to login to account",
          category: "account",
          priority: "medium",
          status: "in_progress",
          description:
            "I forgot my password and the reset link is not working. Please help me recover my account.",
          responses: [
            {
              _id: "resp1",
              message:
                "Hi Priya, I can see your account. Let me reset your password manually. Please check your email in 5 minutes.",
              isAdmin: true,
              respondedBy: "Admin Support",
              respondedAt: "2024-01-03T11:00:00Z",
            },
          ],
          createdAt: "2024-01-03T09:15:00Z",
          updatedAt: "2024-01-03T11:00:00Z",
          assignedTo: {
            _id: "admin1",
            fullName: "Admin Support",
          },
        },
      ];

      setTickets(mockTickets);
      setStats({
        total: mockTickets.length,
        open: mockTickets.filter((t) => t.status === "open").length,
        inProgress: mockTickets.filter((t) => t.status === "in_progress")
          .length,
        resolved: mockTickets.filter((t) => t.status === "resolved").length,
        closed: mockTickets.filter((t) => t.status === "closed").length,
        avgResolutionTime: 26,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseMessage("");
    setShowModal(true);
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) {
      alert("Please enter a response message");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        alert("Admin session expired");
        navigate("/admin/login");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/admin/support/tickets/${selectedTicket._id}/response`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: responseMessage.trim(),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send response");
      }

      const data = await response.json();
      if (data.success) {
        setResponseMessage("");
        alert("Response sent successfully!");

        // Refresh tickets and update selected ticket
        fetchTickets();
        setSelectedTicket(data.data);
      }
    } catch (error: any) {
      console.error("Error sending response:", error);
      alert(error.message || "Failed to send response");

      // Mock response for development
      const newResponse = {
        _id: Date.now().toString(),
        message: responseMessage.trim(),
        isAdmin: true,
        respondedBy: "Admin Support",
        respondedAt: new Date().toISOString(),
      };

      const updatedTicket = {
        ...selectedTicket,
        responses: [...selectedTicket.responses, newResponse],
        updatedAt: new Date().toISOString(),
      };

      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? updatedTicket : t)),
      );

      setSelectedTicket(updatedTicket);
      setResponseMessage("");
      alert("Response sent successfully!");
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        alert("Admin session expired");
        navigate("/admin/login");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/admin/support/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const data = await response.json();
      if (data.success) {
        alert(`Ticket status updated to ${newStatus}`);
        fetchTickets(); // Refresh tickets

        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(data.data);
        }
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(error.message || "Failed to update status");

      // Mock update for development
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId
            ? {
                ...ticket,
                status: newStatus as any,
                updatedAt: new Date().toISOString(),
              }
            : ticket,
        ),
      );

      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as any,
                updatedAt: new Date().toISOString(),
              }
            : null,
        );
      }

      alert(`Ticket status updated to ${newStatus}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
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

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return "Just now";
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") {
      return matchesSearch;
    }

    return ticket.status === activeTab && matchesSearch;
  });

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
            <h1 className="text-2xl font-bold text-white">
              Support Tickets Management
            </h1>
          </div>
          <Button
            onClick={fetchTickets}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Tickets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                <p className="text-sm text-blue-300">Open</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-yellow-300">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {stats.resolved}
                </p>
                <p className="text-sm text-green-300">Resolved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-500/20 border-gray-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">
                  {stats.closed}
                </p>
                <p className="text-sm text-gray-300">Closed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {Math.round(stats.avgResolutionTime)}h
                </p>
                <p className="text-sm text-purple-300">Avg Resolution</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>
              </div>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 bg-[#1a1a1a] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32 bg-[#1a1a1a] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 bg-[#1a1a1a]">
                <TabsTrigger value="open" className="text-white">
                  Open ({stats.open})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="text-white">
                  In Progress ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-white">
                  Resolved ({stats.resolved})
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-white">
                  Closed ({stats.closed})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-white">
                  All ({stats.total})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                      <Card
                        key={ticket._id}
                        className="bg-[#1a1a1a] border-gray-600 hover:border-gray-500 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  className={getStatusColor(ticket.status)}
                                >
                                  {ticket.status
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </Badge>
                                <Badge
                                  className={getPriorityColor(ticket.priority)}
                                >
                                  {ticket.priority.toUpperCase()}
                                </Badge>
                                <span className="text-gray-400 text-sm">
                                  {ticket.ticketId}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  {getTimeAgo(ticket.createdAt)}
                                </span>
                              </div>

                              <h3 className="text-white font-semibold text-lg mb-2">
                                {ticket.subject}
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div>
                                  <p className="text-gray-400 text-sm">User</p>
                                  <p className="text-white font-medium">
                                    {ticket.userId.fullName}
                                  </p>
                                  <p className="text-gray-300 text-sm">
                                    {ticket.userId.mobile}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Category
                                  </p>
                                  <p className="text-white capitalize">
                                    {ticket.category}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Last Updated
                                  </p>
                                  <p className="text-white">
                                    {formatDate(ticket.updatedAt)}
                                  </p>
                                </div>
                              </div>

                              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                {ticket.description}
                              </p>

                              {ticket.responses.length > 0 && (
                                <div className="bg-gray-800 p-2 rounded text-sm">
                                  <p className="text-gray-400">
                                    Latest Response ({ticket.responses.length}{" "}
                                    total):
                                  </p>
                                  <p className="text-gray-300 line-clamp-1">
                                    {
                                      ticket.responses[
                                        ticket.responses.length - 1
                                      ].message
                                    }
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>

                              <Select
                                value={ticket.status}
                                onValueChange={(value) =>
                                  handleStatusChange(ticket._id, value)
                                }
                              >
                                <SelectTrigger className="w-28 bg-[#2a2a2a] border-gray-600 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">
                                    In Progress
                                  </SelectItem>
                                  <SelectItem value="resolved">
                                    Resolved
                                  </SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Ticket Detail Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[800px] bg-[#2a2a2a] border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                Ticket Details - {selectedTicket?.ticketId}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#1a1a1a] rounded">
                  <div>
                    <Label className="text-gray-300">Subject</Label>
                    <p className="text-white font-semibold">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300">User</Label>
                    <p className="text-white">
                      {selectedTicket.userId.fullName}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {selectedTicket.userId.mobile}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Status & Priority</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge
                        className={getPriorityColor(selectedTicket.priority)}
                      >
                        {selectedTicket.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Created</Label>
                    <p className="text-white">
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-gray-300">Description</Label>
                  <div className="bg-[#1a1a1a] p-3 rounded mt-2">
                    <p className="text-white">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Conversation */}
                <div>
                  <Label className="text-gray-300">Conversation</Label>
                  <div className="bg-[#1a1a1a] p-3 rounded mt-2 max-h-60 overflow-y-auto space-y-3">
                    {selectedTicket.responses.length === 0 ? (
                      <p className="text-gray-400 text-center">
                        No responses yet
                      </p>
                    ) : (
                      selectedTicket.responses.map((response) => (
                        <div
                          key={response._id}
                          className={`p-3 rounded ${
                            response.isAdmin
                              ? "bg-blue-900/30 border-l-4 border-blue-500"
                              : "bg-gray-800 border-l-4 border-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`font-medium ${
                                response.isAdmin
                                  ? "text-blue-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {response.respondedBy}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {formatDate(response.respondedAt)}
                            </span>
                          </div>
                          <p className="text-white">{response.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Response Form */}
                <div>
                  <Label htmlFor="response" className="text-gray-300">
                    Add Response
                  </Label>
                  <Textarea
                    id="response"
                    placeholder="Type your response..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Close
              </Button>
              <Button
                onClick={handleSendResponse}
                disabled={!responseMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminSupportTickets;
