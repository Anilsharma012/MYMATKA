import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  Copy,
  Upload,
  QrCode,
  Smartphone,
  Building2,
  Coins,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface PaymentGateway {
  _id: string;
  type: "upi" | "bank" | "crypto";
  name: string;
  displayName: string;
  isActive: boolean;
  upiId?: string;
  qrCodeUrl?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  walletAddress?: string;
  network?: string;
  minAmount?: number;
  maxAmount?: number;
  processingTime?: string;
}

interface PaymentRequest {
  _id: string;
  gatewayId: PaymentGateway;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processing";
  referenceId: string;
  createdAt: string;
}

const AddMoney = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("100");
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    fetchGateways();

    // Only fetch user's payment requests if token exists
    const token = localStorage.getItem("matka_token");
    if (token) {
      fetchMyRequests();
    }
  }, []);

  const fetchGateways = async (retryCount = 0) => {
    if (!gatewaysLoading && retryCount === 0) {
      return; // Prevent multiple calls
    }

    try {
      setGatewaysLoading(true);
      const response = await fetch(`${BASE_URL}/api/payment-gateways/active`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setGateways(data.data);
      } else {
        console.error("API returned error:", data.message);
        setGateways([]);
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be responding");
        // Retry once after 2 seconds
        if (retryCount < 1) {
          setTimeout(() => {
            console.log("Retrying to fetch gateways...");
            fetchGateways(retryCount + 1);
          }, 2000);
          return;
        }
      }
      setGateways([]);
    } finally {
      setGatewaysLoading(false);
    }
  };

  const fetchMyRequests = async (retryCount = 0) => {
    if (requestsLoading && retryCount === 0) {
      return; // Prevent multiple calls
    }

    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        console.log("No auth token found, skipping payment requests fetch");
        return;
      }

      setRequestsLoading(true);
      const response = await fetch(`${BASE_URL}/api/payment-requests/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log("Auth token expired, redirecting to login");
          localStorage.removeItem("matka_token");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMyRequests(data.data.requests);
      } else {
        console.error("API returned error:", data.message);
        setMyRequests([]);
      }
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be responding");
        // Retry once after 2 seconds
        if (retryCount < 1) {
          setTimeout(() => {
            console.log("Retrying to fetch payment requests...");
            fetchMyRequests(retryCount + 1);
          }, 2000);
          return;
        }
      }
      setMyRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!selectedGateway) {
      alert("Please select a payment method");
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < (selectedGateway.minAmount || 10)) {
      alert(`Minimum amount is ₹${selectedGateway.minAmount || 10}`);
      return;
    }

    if (amountNum > (selectedGateway.maxAmount || 100000)) {
      alert(`Maximum amount is ₹${selectedGateway.maxAmount || 100000}`);
      return;
    }

    setShowPaymentModal(true);
  };

  const handleSubmitPaymentProof = async () => {
    if (!transactionId.trim()) {
      alert("Please enter transaction ID");
      return;
    }

    if (!paymentProof.trim()) {
      alert("Please upload payment proof");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("matka_token");

      if (!token) {
        alert("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/payment-requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gatewayId: selectedGateway?._id,
          amount: parseFloat(amount),
          transactionId,
          paymentProofUrl: paymentProof,
          userNotes,
        }),
      });

      // Handle response more robustly
      let data = null;
      try {
        // Clone the response to avoid "body stream already read" errors
        const responseClone = response.clone();

        // Try to parse as JSON first
        try {
          data = await response.json();
        } catch (jsonError) {
          console.log("JSON parsing failed, trying text:", jsonError.message);
          // If JSON parsing fails, try reading as text from the cloned response
          try {
            const responseText = await responseClone.text();
            console.log("Response text:", responseText);

            // Try to parse the text as JSON
            if (responseText) {
              data = JSON.parse(responseText);
            }
          } catch (textError) {
            console.error("Could not read response as text:", textError);
            // If we can't read the response, create a default response based on status
            if (response.ok) {
              data = { message: "Payment request submitted successfully!" };
            } else {
              data = { message: "Failed to submit payment request" };
            }
          }
        }
      } catch (error) {
        console.error("Response handling error:", error);
        alert("Network error occurred while processing response");
        return;
      }

      // Handle based on response status
      if (!response.ok) {
        const errorMessage =
          data?.message || "Failed to submit payment request";
        alert(errorMessage);
        return;
      }

      alert(
        data?.message ||
          "Payment request submitted successfully! We will verify and add money to your wallet.",
      );
      setShowPaymentModal(false);
      setTransactionId("");
      setPaymentProof("");
      setUserNotes("");

      // Refresh payment requests
      fetchMyRequests();
    } catch (error) {
      console.error("Error submitting payment request:", error);
      alert("Failed to submit payment request");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        alert("Please login first");
        return;
      }

      console.log("🔄 Uploading payment proof file:", file.name);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("qr", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ File uploaded successfully:", data.data.url);
        setPaymentProof(data.data.url);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("❌ File upload error:", error);
      alert("Failed to upload payment proof. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "rejected":
        return "text-red-500";
      case "processing":
        return "text-blue-500";
      default:
        return "text-foreground";
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
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const upiGateways = gateways.filter((g) => g.type?.toLowerCase() === "upi");
  const bankGateways = gateways.filter((g) => g.type?.toLowerCase() === "bank");
  const cryptoGateways = gateways.filter(
    (g) => g.type?.toLowerCase() === "crypto",
  );

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/wallet")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">Add Money</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Amount Input Card */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-6">
            <h2 className="text-matka-gold text-xl font-bold mb-4 text-center">
              Enter Amount
            </h2>

            <div className="text-4xl font-bold text-foreground mb-4 text-center">
              ₹{amount}
            </div>

            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-xl py-3 bg-input border-border text-foreground mb-4"
              placeholder="Enter amount"
              min="1"
            />

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {["100", "500", "1000", "2000", "5000", "10000"].map((value) => (
                <Button
                  key={value}
                  onClick={() => setAmount(value)}
                  variant="outline"
                  size="sm"
                  className={`${
                    amount === value
                      ? "bg-matka-gold text-matka-dark border-matka-gold"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  ₹{value}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">
              Select Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gatewaysLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Tabs defaultValue="upi" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-muted/20">
                  <TabsTrigger
                    value="upi"
                    className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                  >
                    <Smartphone className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">UPI</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bank"
                    className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                  >
                    <Building2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Bank</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="crypto"
                    className="data-[state=active]:bg-matka-gold data-[state=active]:text-matka-dark"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    A-coins
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upi" className="space-y-3">
                  {upiGateways.map((gateway) => (
                    <Card
                      key={gateway._id}
                      className={`cursor-pointer transition-all ${
                        selectedGateway?._id === gateway._id
                          ? "border-matka-gold bg-matka-gold/10"
                          : "border-border hover:border-border/80"
                      }`}
                      onClick={() => setSelectedGateway(gateway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {gateway.displayName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {gateway.upiId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Processing: {gateway.processingTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className="text-green-500 border-green-500"
                            >
                              ₹{gateway.minAmount}-₹{gateway.maxAmount}
                            </Badge>
                            {gateway.qrCodeUrl && (
                              <div className="mt-1">
                                <QrCode className="h-4 w-4 text-matka-gold" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="bank" className="space-y-3">
                  {bankGateways.map((gateway) => (
                    <Card
                      key={gateway._id}
                      className={`cursor-pointer transition-all ${
                        selectedGateway?._id === gateway._id
                          ? "border-matka-gold bg-matka-gold/10"
                          : "border-border hover:border-border/80"
                      }`}
                      onClick={() => setSelectedGateway(gateway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {gateway.displayName}
                            </h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>A/C: {gateway.accountHolderName}</p>
                              <p>No: {gateway.accountNumber}</p>
                              <p>IFSC: {gateway.ifscCode}</p>
                              <p>Bank: {gateway.bankName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className="text-green-500 border-green-500"
                            >
                              ₹{gateway.minAmount}-₹{gateway.maxAmount}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="crypto" className="space-y-3">
                  {cryptoGateways.map((gateway) => (
                    <Card
                      key={gateway._id}
                      className={`cursor-pointer transition-all ${
                        selectedGateway?._id === gateway._id
                          ? "border-matka-gold bg-matka-gold/10"
                          : "border-border hover:border-border/80"
                      }`}
                      onClick={() => setSelectedGateway(gateway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {gateway.displayName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {gateway.walletAddress}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Network: {gateway.network}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className="text-green-500 border-green-500"
                            >
                              ��{gateway.minAmount}-₹{gateway.maxAmount}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Proceed Button */}
        <Button
          onClick={handleProceedToPayment}
          disabled={!selectedGateway}
          className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-4 text-lg rounded-xl hover:from-yellow-500 hover:to-matka-gold transition-all duration-300 disabled:opacity-50"
        >
          Proceed to Payment
        </Button>

        {/* Recent Payment Requests */}
        {myRequests.length > 0 && (
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="text-foreground">
                Recent Payment Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRequests.slice(0, 5).map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        ₹{request.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.gatewayId?.displayName || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.referenceId}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-2 ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="capitalize font-medium">
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Complete Payment - ₹{amount}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Payment Details */}
              <Card className="bg-muted/20 border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">
                    {selectedGateway?.displayName}
                  </h3>

                  {selectedGateway?.type === "upi" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">UPI ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-mono">
                            {selectedGateway.upiId}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(selectedGateway.upiId || "")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
       {selectedGateway.qrCodeUrl && (() => {
  const qrUrl = selectedGateway.qrCodeUrl;

  // ✅ Dynamically replace base URL only if needed
  const encodedUrl = encodeURI(
    qrUrl.includes("cdn.matkahub.com")
      ? qrUrl.replace("https://cdn.matkahub.com", BASE_URL)
      : qrUrl
  );

  console.log("✅ Final Encoded QR URL:", encodedUrl);

  return (
    <div className="text-center">
      <img
        src={encodedUrl}
        alt="QR Code"
        className="w-48 h-48 object-contain mx-auto rounded-lg bg-white"
      />
      <p className="text-sm text-muted-foreground mt-2">
        Scan QR code to pay
      </p>
    </div>
  );
})()}

                    </div>
                  )}

                  {selectedGateway?.type === "bank" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Account Holder:
                          </span>
                          <p className="text-foreground font-semibold">
                            {selectedGateway.accountHolderName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Account Number:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">
                              {selectedGateway.accountNumber}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  selectedGateway.accountNumber || "",
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            IFSC Code:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">
                              {selectedGateway.ifscCode}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(selectedGateway.ifscCode || "")
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Bank Name:
                          </span>
                          <p className="text-foreground font-semibold">
                            {selectedGateway.bankName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Payment Proof */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transactionId" className="text-foreground">
                    Transaction ID / UTR Number *
                  </Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentProof" className="text-foreground">
                    Payment Proof *
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {uploadingFile ? (
                      <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full mx-auto mb-2"></div>
                    ) : (
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground mb-2">
                      {uploadingFile
                        ? "Uploading..."
                        : "Upload payment screenshot"}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && !uploadingFile) handleFileUpload(file);
                      }}
                      disabled={uploadingFile}
                      className="hidden"
                      id="payment-proof-upload"
                    />
                    <Label
                      htmlFor="payment-proof-upload"
                      className="cursor-pointer text-matka-gold hover:underline"
                    >
                      Choose File
                    </Label>
                    {paymentProof && (
                      <p className="text-xs text-green-500 mt-2">
                        Screenshot uploaded successfully
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="userNotes" className="text-foreground">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="userNotes"
                    placeholder="Any additional information..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitPaymentProof}
                disabled={loading}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AddMoney;
