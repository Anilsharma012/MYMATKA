import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";

interface WalletData {
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
  });
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWithdraw = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(formData.amount);

    if (amount < 100) {
      alert("Minimum withdrawal amount is ₹100");
      return;
    }

    if (!walletData || walletData.winningBalance < amount) {
      alert("Insufficient winning balance for withdrawal");
      return;
    }

    if (
      !formData.bankName ||
      !formData.accountNumber ||
      !formData.ifscCode ||
      !formData.accountHolderName
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (
      formData.accountNumber.length < 8 ||
      formData.accountNumber.length > 18
    ) {
      alert("Please enter a valid account number (8-18 digits)");
      return;
    }

    if (formData.ifscCode.length !== 11) {
      alert("Please enter a valid IFSC code (11 characters)");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            accountHolderName: formData.accountHolderName,
          },
        }),
      });

      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error("Could not parse response JSON:", parseError);
      }

      if (response.ok) {
        alert(`🎉 WITHDRAWAL REQUEST SUBMITTED!

💰 Amount: ₹${amount.toLocaleString()}
🏦 Bank: ${formData.bankName}
⏱️ Processing Time: 24-48 hours

✅ Your request has been sent to admin for approval.
📱 You will be notified once processed.

Thank you for your patience!`);
        navigate("/wallet");
      } else {
        alert(
          `❌ WITHDRAWAL FAILED\n\n${data?.message || "Failed to submit withdrawal request"}\n\nPlease try again or contact support.`,
        );
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-foreground text-xl font-bold">Withdraw Cash</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Wallet Balance Card */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Available for Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-4 border-matka-gold border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-4xl font-bold text-green-500 mb-2">
                  ₹{walletData?.winningBalance?.toLocaleString() || 0}
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Winning Balance (Only winning balance can be withdrawn)
                </p>
                <div className="flex items-center justify-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-full text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  100% Safe & Secure
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Information */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Withdrawal Information
              </h3>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• Only winning balance can be withdrawn</li>
                <li>• Withdrawals are processed within 24-48 hours</li>
                <li>• Minimum withdrawal amount: ₹100</li>
                <li>• All withdrawals require admin approval</li>
                <li>• Ensure bank details are correct before submitting</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Withdrawal Request
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label
                htmlFor="amount"
                className="text-foreground text-lg mb-2 block"
              >
                Withdrawal Amount * (Min: ₹100)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter withdrawal amount"
                value={formData.amount}
                onChange={handleChange}
                className="bg-muted border-border text-foreground text-lg py-3"
                min="100"
                max={walletData?.winningBalance || 0}
                required
              />
              {formData.amount && (
                <div className="mt-1">
                  {parseFloat(formData.amount) >
                    (walletData?.winningBalance || 0) && (
                    <p className="text-red-500 text-sm">
                      Amount exceeds available balance
                    </p>
                  )}
                  {parseFloat(formData.amount) < 100 &&
                    parseFloat(formData.amount) > 0 && (
                      <p className="text-yellow-500 text-sm">
                        Minimum withdrawal amount is ₹100
                      </p>
                    )}
                  {parseFloat(formData.amount) >= 100 &&
                    parseFloat(formData.amount) <=
                      (walletData?.winningBalance || 0) && (
                      <p className="text-green-500 text-sm">✓ Valid amount</p>
                    )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="accountHolderName"
                className="text-foreground text-lg mb-2 block"
              >
                Account Holder Name *
              </Label>
              <Input
                id="accountHolderName"
                name="accountHolderName"
                type="text"
                placeholder="Enter account holder name"
                value={formData.accountHolderName}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="bankName"
                className="text-foreground text-lg mb-2 block"
              >
                Bank Name *
              </Label>
              <Input
                id="bankName"
                name="bankName"
                type="text"
                placeholder="Enter bank name"
                value={formData.bankName}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="accountNumber"
                className="text-foreground text-lg mb-2 block"
              >
                Bank Account Number * (8-18 digits)
              </Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                type="text"
                placeholder="Enter account number"
                value={formData.accountNumber}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                maxLength={18}
                required
              />
              {formData.accountNumber && (
                <div className="mt-1">
                  {formData.accountNumber.length < 8 ||
                  formData.accountNumber.length > 18 ? (
                    <p className="text-red-500 text-sm">
                      Account number must be 8-18 digits
                    </p>
                  ) : (
                    <p className="text-green-500 text-sm">
                      ✓ Valid account number
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="ifscCode"
                className="text-foreground text-lg mb-2 block"
              >
                IFSC Code * (11 characters)
              </Label>
              <Input
                id="ifscCode"
                name="ifscCode"
                type="text"
                placeholder="Enter IFSC code (e.g. HDFC0000123)"
                value={formData.ifscCode}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  setFormData({
                    ...formData,
                    ifscCode: value,
                  });
                }}
                className="bg-muted border-border text-foreground"
                maxLength={11}
                required
              />
              {formData.ifscCode && (
                <div className="mt-1">
                  {formData.ifscCode.length !== 11 ? (
                    <p className="text-red-500 text-sm">
                      IFSC code must be exactly 11 characters
                    </p>
                  ) : (
                    <p className="text-green-500 text-sm">✓ Valid IFSC code</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleWithdraw}
            disabled={
              loading ||
              !walletData ||
              parseFloat(formData.amount || "0") > walletData.winningBalance
            }
            className="flex-1 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 hover:from-yellow-500 hover:to-matka-gold transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "SUBMIT WITHDRAWAL REQUEST"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/wallet")}
            className="flex-1 border-border text-foreground hover:bg-muted py-3"
          >
            VIEW WALLET
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
