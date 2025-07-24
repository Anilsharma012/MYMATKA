import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
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
  Eye,
  Check,
  X,
  Clock,
  RefreshCw,
  ExternalLink,
  User,
  CreditCard,
} from "lucide-react";

interface PaymentRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
  };
  gatewayId: {
    _id: string;
    displayName: string;
    type: string;
  };
  amount: number;
  status: "pending" | "approved" | "rejected";
  transactionId?: string;
  paymentProofUrl?: string;
  userNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  referenceId: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    fullName: string;
  };
}

const AdminPaymentRequests = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const navigate = useNavigate();

  // Utility function to properly encode payment proof URLs
  const encodePaymentProofUrl = (url: string) => {
    if (!url) return url;

    console.log("🔍 Encoding payment proof URL:", url);

    // If it's a local API URL, encode only the filename part
    if (url.startsWith("/api/uploads/")) {
      const filename = url.substring("/api/uploads/".length);
      const encodedUrl = `/api/uploads/${encodeURIComponent(filename)}`;
      console.log("✅ Encoded URL:", encodedUrl);
      return encodedUrl;
    }

    // For other URLs, use standard encoding
    const encodedUrl = encodeURI(url);
    console.log("✅ Standard encoded URL:", encodedUrl);
    return encodedUrl;
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchPaymentRequests();
  }, [navigate, statusFilter]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/payment-requests?status=${statusFilter}&limit=50`,
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

        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.text();
          console.error("API Error Response:", errorData);
          errorMessage += ` - ${errorData}`;
        } catch (e) {
          console.error("Could not read error response");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data.requests);

        // Calculate stats
        const allRequests = data.data.requests;
        const stats = {
          total: allRequests.length,
          pending: allRequests.filter(
            (r: PaymentRequest) => r.status === "pending",
          ).length,
          approved: allRequests.filter(
            (r: PaymentRequest) => r.status === "approved",
          ).length,
          rejected: allRequests.filter(
            (r: PaymentRequest) => r.status === "rejected",
          ).length,
          totalAmount: allRequests
            .filter((r: PaymentRequest) => r.status === "approved")
            .reduce((sum: number, r: PaymentRequest) => sum + r.amount, 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      console.error(
        "Request URL:",
        `/api/admin/payment-requests?status=${statusFilter}&limit=50`,
      );
      console.error(
        "Admin token present:",
        !!localStorage.getItem("admin_token"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setShowModal(true);
  };

  const handleViewProof = (proofUrl: string) => {
    setSelectedProofUrl(proofUrl);
    setShowProofModal(true);
  };

  const handleProcessRequest = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    if (action === "reject" && !adminNotes.trim()) {
      alert("Please provide rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/payment-requests/${selectedRequest._id}/process`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            adminNotes: adminNotes.trim(),
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowModal(false);
        setSelectedRequest(null);
        setAdminNotes("");
        fetchPaymentRequests(); // Refresh the list
      } else {
        alert(data.message || `Failed to ${action} payment request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payment request:`, error);
      alert(`Failed to ${action} payment request`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
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
              Payment Requests Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchPaymentRequests}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                // Clear cache and force hard refresh
                if (window.caches) {
                  window.caches.keys().then((names) => {
                    names.forEach((name) => window.caches.delete(name));
                  });
                }
                fetchPaymentRequests();
              }}
              variant="outline"
              className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
            >
              🗑️ Clear Cache
            </Button>
          </div>
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
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="approved">Approved Only</SelectItem>
                  <SelectItem value="rejected">Rejected Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Requests List */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No payment requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card
                    key={request._id}
                    className="bg-[#1a1a1a] border-gray-600"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {request.referenceId}
                            </span>
                            <span className="text-sm text-gray-400">
                              {formatDate(request.createdAt)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-white font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {request.userId.fullName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {request.userId.mobile} • {request.userId.email}
                              </p>
                            </div>

                            <div>
                              <p className="text-white font-semibold">
                                ₹{request.amount.toLocaleString()}
                              </p>
                              <p className="text-gray-400 text-sm">
                                via {request.gatewayId?.displayName || "Unknown Gateway" }
                              </p>
                              {request.transactionId && (
                                <p className="text-blue-400 text-sm">
                                  TXN: {request.transactionId}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {request.paymentProofUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewProof(request.paymentProofUrl!)
                                  }
                                  className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Proof
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequest(request)}
                                className="text-gray-300 border-gray-600 hover:bg-gray-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>

                          {request.userNotes && (
                            <div className="mt-3 p-2 bg-gray-800 rounded">
                              <p className="text-gray-300 text-sm">
                                <strong>User Notes:</strong> {request.userNotes}
                              </p>
                            </div>
                          )}

                          {request.status !== "pending" &&
                            request.reviewedBy && (
                              <div className="mt-2 text-sm text-gray-400">
                                {request.status === "approved"
                                  ? "Approved"
                                  : "Rejected"}{" "}
                                by {request.reviewedBy.fullName} on{" "}
                                {request.reviewedAt &&
                                  formatDate(request.reviewedAt)}
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

        {/* Process Request Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-[#2a2a2a] border-gray-700 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-white">
                Process Payment Request
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">User</Label>
                      <p className="text-white">
                        {selectedRequest.userId.fullName}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {selectedRequest.userId.mobile}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Amount</Label>
                      <p className="text-white text-xl font-bold">
                        ₹{selectedRequest.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Payment Gateway</Label>
                    <p className="text-white">
                      {selectedRequest.gatewayId.displayName}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Type: {selectedRequest.gatewayId.type.toUpperCase()}
                    </p>
                  </div>

                  {selectedRequest.transactionId && (
                    <div>
                      <Label className="text-gray-300">Transaction ID</Label>
                      <p className="text-white font-mono">
                        {selectedRequest.transactionId}
                      </p>
                    </div>
                  )}

                  {selectedRequest.paymentProofUrl && (
                    <div>
                      <Label className="text-gray-300">Payment Proof</Label>
                      <div className="mt-2 space-y-2">
                        {/* Image Preview */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                          <div className="relative">
                            <img
                              src={encodePaymentProofUrl(
                                selectedRequest.paymentProofUrl,
                              )}
                              alt="Payment Proof"
                              className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                              onLoad={(e) => {
                                console.log(
                                  "✅ Payment proof loaded successfully",
                                );
                                const fallback = (
                                  e.target as HTMLImageElement
                                ).parentElement?.querySelector(
                                  ".fallback-content",
                                ) as HTMLElement;
                                if (fallback) fallback.style.display = "none";
                              }}
                              onError={(e) => {
                                const actualSrc = (e.target as HTMLImageElement)
                                  .src;
                                console.error(
                                  "❌ Payment proof failed to load:",
                                );
                                console.error(
                                  "   Original URL:",
                                  selectedRequest.paymentProofUrl,
                                );
                                console.error(
                                  "   Encoded URL:",
                                  encodePaymentProofUrl(
                                    selectedRequest.paymentProofUrl,
                                  ),
                                );
                                console.error("   Actual src:", actualSrc);
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const fallback = (
                                  e.target as HTMLImageElement
                                ).parentElement?.querySelector(
                                  ".fallback-content",
                                ) as HTMLElement;
                                if (fallback) fallback.style.display = "block";
                              }}
                            />
                            {/* Fallback content */}
                            <div
                              className="fallback-content text-center py-8"
                              style={{ display: "none" }}
                            >
                              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                                <p className="text-red-400 font-semibold mb-2">
                                  ⚠️ Payment Proof Not Available
                                </p>
                                <p className="text-gray-300 text-sm mb-2">
                                  The uploaded image could not be displayed.
                                </p>
                                <p className="text-gray-400 text-xs break-all">
                                  URL: {selectedRequest.paymentProofUrl}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-yellow-400 text-sm">
                                  💡 Possible reasons:
                                </p>
                                <ul className="text-gray-400 text-xs space-y-1">
                                  <li>
                                    • Original file was not properly uploaded
                                  </li>
                                  <li>
                                    • File may have been deleted from server
                                  </li>
                                  <li>
                                    • URL format changed during system updates
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Open in new tab button */}
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(
                              encodePaymentProofUrl(
                                selectedRequest.paymentProofUrl,
                              ),
                              "_blank",
                            )
                          }
                          className="w-full text-blue-400 border-blue-400 hover:bg-blue-400/20"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.userNotes && (
                    <div>
                      <Label className="text-gray-300">User Notes</Label>
                      <p className="text-white bg-gray-800 p-3 rounded">
                        {selectedRequest.userNotes}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="adminNotes" className="text-gray-300">
                      Admin Notes{" "}
                      {selectedRequest.status === "pending" &&
                        "(Required for rejection)"}
                    </Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add notes about this request..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      rows={3}
                      disabled={selectedRequest.status !== "pending"}
                    />
                  </div>

                  {selectedRequest.status !== "pending" && (
                    <div className="bg-gray-800 p-3 rounded">
                      <p className="text-gray-300">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            selectedRequest.status === "approved"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {selectedRequest.status.toUpperCase()}
                        </span>
                      </p>
                      {selectedRequest.adminNotes && (
                        <p className="text-gray-300 mt-2">
                          <strong>Admin Notes:</strong>{" "}
                          {selectedRequest.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedRequest && selectedRequest.status === "pending" && (
              <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => handleProcessRequest("reject")}
                  disabled={processing}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  {processing ? "Processing..." : "Reject"}
                </Button>
                <Button
                  onClick={() => handleProcessRequest("approve")}
                  disabled={processing}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processing ? "Processing..." : "Approve"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Proof Modal */}
        <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] bg-[#2a2a2a] border-gray-700 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-white">Payment Proof</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pr-2">
                {selectedProofUrl && (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <div className="relative">
                      <img
                        src={encodePaymentProofUrl(selectedProofUrl)}
                        alt="Payment Proof"
                        className="max-w-full h-auto mx-auto rounded-lg shadow-lg cursor-zoom-in"
                        style={{ maxHeight: "calc(90vh - 200px)" }}
                        onClick={() => {
                          // Open in new tab when clicked
                          window.open(
                            encodePaymentProofUrl(selectedProofUrl),
                            "_blank",
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            "✅ Payment proof modal image loaded successfully",
                          );
                        }}
                        onError={(e) => {
                          const actualSrc = (e.target as HTMLImageElement).src;
                          console.error(
                            "❌ Payment proof modal image failed to load:",
                          );
                          console.error("   Original URL:", selectedProofUrl);
                          console.error(
                            "   Encoded URL:",
                            encodePaymentProofUrl(selectedProofUrl),
                          );
                          console.error("   Actual src:", actualSrc);
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallback = (
                            e.target as HTMLImageElement
                          ).parentElement?.querySelector(
                            ".modal-fallback",
                          ) as HTMLElement;
                          if (fallback) fallback.style.display = "block";
                        }}
                      />
                      {/* Fallback content */}
                      <div
                        className="modal-fallback text-center py-8"
                        style={{ display: "none" }}
                      >
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-4">
                          <div className="text-6xl mb-4">🚫</div>
                          <p className="text-red-400 font-semibold mb-2">
                            Payment Proof Not Available
                          </p>
                          <p className="text-gray-300 text-sm mb-4">
                            The payment proof image cannot be displayed. This
                            might be because:
                          </p>
                          <ul className="text-gray-400 text-sm text-left space-y-1 max-w-md mx-auto">
                            <li>• The file was not properly uploaded</li>
                            <li>• The file has been moved or deleted</li>
                            <li>• There was an issue with the upload system</li>
                            <li>• The URL format has changed</li>
                          </ul>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3 mb-4">
                          <p className="text-gray-400 text-xs break-all">
                            <strong>URL:</strong> {selectedProofUrl}
                          </p>
                        </div>
                        <p className="text-yellow-400 text-sm">
                          💡 You may need to ask the user to re-upload their
                          payment proof
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(encodePaymentProofUrl(selectedProofUrl), "_blank")
                }
                className="flex-1 text-blue-400 border-blue-400 hover:bg-blue-400/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                onClick={() => setShowProofModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPaymentRequests;
