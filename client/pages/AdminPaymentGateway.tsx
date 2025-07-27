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
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Smartphone,
  Building2,
  Coins,
  QrCode,
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
  adminNotes?: string;
  minAmount?: number;
  maxAmount?: number;
  processingTime?: string;
  createdAt: string;
}

interface GatewayStats {
  total: number;
  active: number;
  upi: number;
  bank: number;
  crypto: number;
}

const AdminPaymentGateway = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [stats, setStats] = useState<GatewayStats>({
    total: 0,
    active: 0,
    upi: 0,
    bank: 0,
    crypto: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(
    null,
  );
  const [formData, setFormData] = useState({
    type: "upi",
    name: "",
    displayName: "",
    upiId: "",
    qrCodeUrl: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    walletAddress: "",
    network: "",
    adminNotes: "",
    minAmount: 10,
    maxAmount: 100000,
    processingTime: "Instant",
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

    fetchGateways();
  }, [navigate]);

  const fetchGateways = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/payment-gateways`, {
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
      if (data.success) {
        setGateways(data.data.gateways);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGateway = () => {
    setEditingGateway(null);
    setFormData({
      type: "upi",
      name: "",
      displayName: "",
      upiId: "",
      qrCodeUrl: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      walletAddress: "",
      network: "",
      adminNotes: "",
      minAmount: 10,
      maxAmount: 100000,
      processingTime: "Instant",
    });
    setShowAddModal(true);
  };

  const handleEditGateway = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setFormData({
      type: gateway.type,
      name: gateway.name,
      displayName: gateway.displayName,
      upiId: gateway.upiId || "",
      qrCodeUrl: gateway.qrCodeUrl || "",
      accountHolderName: gateway.accountHolderName || "",
      accountNumber: gateway.accountNumber || "",
      ifscCode: gateway.ifscCode || "",
      bankName: gateway.bankName || "",
      branchName: gateway.branchName || "",
      walletAddress: gateway.walletAddress || "",
      network: gateway.network || "",
      adminNotes: gateway.adminNotes || "",
      minAmount: gateway.minAmount || 10,
      maxAmount: gateway.maxAmount || 100000,
      processingTime: gateway.processingTime || "Instant",
    });
    setShowAddModal(true);
  };


  if (!formData.name || formData.name.trim() === "") {
  const autoName = `${formData.type}_${Date.now()}`;
  setFormData((prev) => ({ ...prev, name: autoName }));
}


  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const url = editingGateway
        ? `${BASE_URL}/api/admin/payment-gateways/${editingGateway._id}`
        : `${BASE_URL}/api/admin/payment-gateways`;
      const method = editingGateway ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddModal(false);
        fetchGateways();
        alert(data.message);
      } else {
        alert(data.message || "Failed to save gateway");
      }
    } catch (error) {
      console.error("Error saving gateway:", error);
      alert("Failed to save gateway");
    }
  };

  const handleDeleteGateway = async (gatewayId: string) => {
    if (!confirm("Are you sure you want to delete this gateway?")) {
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/payment-gateways/${gatewayId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        fetchGateways();
        alert(data.message);
      } else {
        alert(data.message || "Failed to delete gateway");
      }
    } catch (error) {
      console.error("Error deleting gateway:", error);
      alert("Failed to delete gateway");
    }
  };

  const handleToggleStatus = async (gateway: PaymentGateway) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${BASE_URL}/api/admin/payment-gateways/${gateway._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...gateway, isActive: !gateway.isActive }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        fetchGateways();
      } else {
        alert(data.message || "Failed to update gateway status");
      }
    } catch (error) {
      console.error("Error updating gateway status:", error);
      alert("Failed to update gateway status");
    }
  };

  const handleFileUpload = async (file: File) => {
    // Mock file upload - in production, you'd use actual file upload service
    const mockUrl = `https://cdn.matkahub.com/qr/${Date.now()}_${file.name}`;
    setFormData((prev) => ({ ...prev, qrCodeUrl: mockUrl }));
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
              Payment Gateway Management
            </h1>
          </div>
          <Button
            onClick={handleAddGateway}
            className="bg-green-500 text-white hover:bg-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Gateway
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-blue-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/30">
                  <Smartphone className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.upi}
                  </p>
                  <p className="text-sm text-blue-300">UPI Gateways</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/30">
                  <Building2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.bank}
                  </p>
                  <p className="text-sm text-green-300">Bank Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/30">
                  <Coins className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {stats.crypto}
                  </p>
                  <p className="text-sm text-purple-300">A-coins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UPI Payment Gateways */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              UPI Payment Gateways (
              {gateways.filter((g) => g.type === "upi").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gateways
                .filter((g) => g.type === "upi")
                .map((gateway) => (
                  <Card key={gateway._id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={gateway.isActive ? "default" : "destructive"}
                          className={
                            gateway.isActive ? "bg-green-500" : "bg-red-500"
                          }
                        >
                          {gateway.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGateway(gateway)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGateway(gateway._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-bold text-foreground">
                        {gateway.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        UPI ID: {gateway.upiId}
                      </p>
                      {gateway.qrCodeUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          <span className="text-xs text-muted-foreground">
                            QR Code Available
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Processing: {gateway.processingTime}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleToggleStatus(gateway)}
                      >
                        {gateway.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Details */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account Details (
              {gateways.filter((g) => g.type === "bank").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gateways
                .filter((g) => g.type === "bank")
                .map((gateway) => (
                  <Card key={gateway._id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={gateway.isActive ? "default" : "destructive"}
                          className={
                            gateway.isActive ? "bg-green-500" : "bg-red-500"
                          }
                        >
                          {gateway.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGateway(gateway)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGateway(gateway._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-bold text-foreground">
                        {gateway.displayName}
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>A/C: {gateway.accountHolderName}</p>
                        <p>No: {gateway.accountNumber}</p>
                        <p>IFSC: {gateway.ifscCode}</p>
                        <p>Bank: {gateway.bankName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleToggleStatus(gateway)}
                      >
                        {gateway.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Gateway Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingGateway
                  ? "Edit Payment Gateway"
                  : "Add Payment Gateway"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right text-foreground">
                  Gateway Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger className="col-span-3 bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI Payment</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Crypto Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "upi" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="upiId"
                      className="text-right text-foreground"
                    >
                      UPI ID *
                    </Label>
                    <Input
                      id="upiId"
                      placeholder="example@okbizaxis"
                      value={formData.upiId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          upiId: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="displayName"
                      className="text-right text-foreground"
                    >
                      Display Name *
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="Primary UPI Payment"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="qrCode"
                      className="text-right text-foreground"
                    >
                      QR Code *
                    </Label>
                    <div className="col-span-3">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Upload QR Code
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                          id="qr-upload"
                        />
                        <Label
                          htmlFor="qr-upload"
                          className="cursor-pointer text-matka-gold hover:underline"
                        >
                          Choose File
                        </Label>
                      </div>
                      {formData.qrCodeUrl && (
                        <p className="text-xs text-green-500 mt-1">
                          QR Code uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {formData.type === "bank" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="accountHolderName"
                      className="text-right text-foreground"
                    >
                      Account Holder Name *
                    </Label>
                    <Input
                      id="accountHolderName"
                      placeholder="JOHN DOE"
                      value={formData.accountHolderName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accountHolderName: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>

                 <div className="grid grid-cols-4 items-center gap-4">
  <Label>Display Name *</Label>
  <Input
    type="text"
    value={formData.displayName}
     onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
    className="col-span-3 bg-input border-border text-foreground"
  />
</div>



                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="accountNumber"
                      className="text-right text-foreground"
                    >
                      Account Number *
                    </Label>
                    <Input
                      id="accountNumber"
                      placeholder="1234567890123456"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="ifscCode"
                      className="text-right text-foreground"
                    >
                      IFSC Code *
                    </Label>
                    <Input
                      id="ifscCode"
                      placeholder="HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ifscCode: e.target.value.toUpperCase(),
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="bankName"
                      className="text-right text-foreground"
                    >
                      Bank Name *
                    </Label>
                    <Input
                      id="bankName"
                      placeholder="HDFC Bank"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="branchName"
                      className="text-right text-foreground"
                    >
                      Branch Name
                    </Label>
                    <Input
                      id="branchName"
                      placeholder="Main Branch"
                      value={formData.branchName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          branchName: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                </>
              )}

              {formData.type === "crypto" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="walletAddress"
                      className="text-right text-foreground"
                    >
                      Wallet Address *
                    </Label>
                    <Input
                      id="walletAddress"
                      placeholder="0x1234567890abcdef..."
                      value={formData.walletAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          walletAddress: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="network"
                      className="text-right text-foreground"
                    >
                      Network *
                    </Label>
                    <Input
                      id="network"
                      placeholder="BSC, ETH, TRX"
                      value={formData.network}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          network: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="adminNotes"
                  className="text-right text-foreground"
                >
                  Admin Notes
                </Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Internal notes for admin reference"
                  value={formData.adminNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adminNotes: e.target.value,
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
                onClick={() => setShowAddModal(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {editingGateway ? "Update Gateway" : "Create Gateway"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPaymentGateway;
