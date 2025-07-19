import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  MessageSquare,
  Send,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface SupportTicket {
  _id: string;
  ticketId: string;
  subject: string;
  category: "payment" | "account" | "technical" | "game" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  responses: {
    _id: string;
    message: string;
    isAdmin: boolean;
    respondedBy: string;
    respondedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    category: "other" as const,
    priority: "medium" as const,
    description: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyTickets();
  }, [user, navigate]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("matka_token");

      if (!token) {
        console.log("No auth token found");
        setTickets([]);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/support/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      // Keep empty array on error
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    try {
      if (!formData.subject.trim() || !formData.description.trim()) {
        alert("Please fill all required fields");
        return;
      }

      const token = localStorage.getItem("matka_token");
      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/support/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          category: formData.category,
          priority: formData.priority,
          description: formData.description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit ticket");
      }

      const data = await response.json();
      if (data.success) {
        // Reset form
        setFormData({
          subject: "",
          category: "other",
          priority: "medium",
          description: "",
        });

        alert(
          "Support ticket submitted successfully! Our team will respond soon.",
        );

        // Refresh tickets list
        fetchMyTickets();
      }
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      alert(error.message || "Failed to submit ticket. Please try again.");
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseMessage("");
    setShowModal(true);
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/support/tickets/${selectedTicket._id}/response`,
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
        alert("Message sent successfully!");

        // Refresh tickets and update selected ticket
        fetchMyTickets();

        // Update selected ticket with new response
        if (data.data) {
          setSelectedTicket(data.data);
        }
      }
    } catch (error: any) {
      console.error("Error sending response:", error);
      alert(error.message || "Failed to send message");
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
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Support Center
            </h1>
          </div>
          <Button
            onClick={fetchMyTickets}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit New Ticket */}
          <div className="lg:col-span-1">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Submit New Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject" className="text-foreground">
                    Subject *
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-foreground">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Issues</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="technical">
                        Technical Issues
                      </SelectItem>
                      <SelectItem value="game">Game Related</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-foreground">
                    Priority *
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description of your issue..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-input border-border text-foreground"
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-foreground font-medium mb-2">
                    Common Issues:
                  </p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Payment not reflected - Check transaction ID</li>
                    <li>• Withdrawal issues - Complete KYC verification</li>
                    <li>• Game results - Check official timing</li>
                    <li>• Login problems - Reset password</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <p className="text-foreground font-medium mb-2">
                    Response Time:
                  </p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Urgent: Within 2 hours</li>
                    <li>• High: Within 6 hours</li>
                    <li>• Medium: Within 24 hours</li>
                    <li>• Low: Within 48 hours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Tickets */}
          <div className="lg:col-span-2">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  My Support Tickets ({tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No support tickets found
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Submit your first ticket using the form on the left
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket._id}
                        className="bg-card border-border hover:border-border/70 transition-colors cursor-pointer"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
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
                                <span className="text-muted-foreground text-sm">
                                  {ticket.ticketId}
                                </span>
                              </div>
                              <h3 className="text-foreground font-semibold mb-2">
                                {ticket.subject}
                              </h3>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getTimeAgo(ticket.createdAt)}
                                </span>
                                {ticket.responses.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {ticket.responses.length} responses
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {ticket.status === "resolved" && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              {ticket.status === "in_progress" && (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                          </div>
                          {ticket.responses.length > 0 && (
                            <div className="bg-muted/50 p-2 rounded text-sm">
                              <p className="text-muted-foreground">
                                Latest Response:
                              </p>
                              <p className="text-foreground line-clamp-1">
                                {
                                  ticket.responses[ticket.responses.length - 1]
                                    .message
                                }
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Ticket Details - {selectedTicket?.ticketId}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded">
                  <div>
                    <Label className="text-muted-foreground">Subject</Label>
                    <p className="text-foreground font-semibold">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Status & Priority
                    </Label>
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
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="text-foreground capitalize">
                      {selectedTicket.category}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="text-foreground">
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <div className="bg-muted/30 p-3 rounded mt-2">
                    <p className="text-foreground">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {/* Conversation */}
                <div>
                  <Label className="text-muted-foreground">Conversation</Label>
                  <div className="bg-muted/30 p-3 rounded mt-2 max-h-60 overflow-y-auto space-y-3">
                    {selectedTicket.responses.length === 0 ? (
                      <p className="text-muted-foreground text-center">
                        No responses yet. Our support team will respond soon.
                      </p>
                    ) : (
                      selectedTicket.responses.map((response) => (
                        <div
                          key={response._id}
                          className={`p-3 rounded ${
                            response.isAdmin
                              ? "bg-blue-500/20 border-l-4 border-blue-500"
                              : "bg-matka-gold/20 border-l-4 border-matka-gold"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`font-medium ${
                                response.isAdmin
                                  ? "text-blue-400"
                                  : "text-matka-gold"
                              }`}
                            >
                              {response.respondedBy}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {formatDate(response.respondedAt)}
                            </span>
                          </div>
                          <p className="text-foreground">{response.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Response Form */}
                {selectedTicket.status !== "closed" && (
                  <div>
                    <Label htmlFor="response" className="text-muted-foreground">
                      Add Response
                    </Label>
                    <Textarea
                      id="response"
                      placeholder="Type your message..."
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className="mt-2 bg-input border-border text-foreground"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Close
              </Button>
              {selectedTicket?.status !== "closed" && (
                <Button
                  onClick={handleSendResponse}
                  disabled={!responseMessage.trim()}
                  className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Support;
