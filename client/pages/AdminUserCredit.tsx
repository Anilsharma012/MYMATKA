import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../src/config";

const AdminUserCredit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    mobile: "",
    amount: "",
    type: "winning",
    description: ""
  });
  const [result, setResult] = useState<any>(null);

  const handleFindUser = async () => {
    if (!formData.mobile) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      
      const response = await fetch(`${BASE_URL}/api/admin/users?search=${formData.mobile}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.users.length > 0) {
          const user = data.data.users[0];
          setFormData(prev => ({ ...prev, userId: user._id }));
          console.log("Found user:", user.fullName, user.mobile);
        }
      }
    } catch (error) {
      console.error("Error finding user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCredit = async () => {
    if (!formData.userId || !formData.amount) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      
      const response = await fetch(`${BASE_URL}/api/admin/management/credit-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: formData.userId,
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description || `Manual ${formData.type} credit`
        }),
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setResult(data);
          if (data.success) {
            console.log("✅ Credit successful:", data);
          }
        } catch (parseError) {
          console.error("Error parsing success response:", parseError);
          setResult({
            success: true,
            message: "Credit successful"
          });
        }
      } else {
        // For error responses, don't try to read body - just use status
        const errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        console.error("Credit request failed:", errorMessage);

        setResult({
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error("Error crediting user:", error);
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-matka-dark">
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/users")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">Credit User Balance</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-foreground">Manual Balance Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Find User */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-foreground">User Mobile Number</Label>
              <div className="flex gap-2">
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  className="flex-1"
                />
                <Button onClick={handleFindUser} disabled={loading}>
                  Find User
                </Button>
              </div>
            </div>

            {/* Credit Details */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to credit"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-foreground">Credit Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select credit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winning">Winning</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleCredit} 
              disabled={loading || !formData.userId || !formData.amount}
              className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
            >
              {loading ? "Processing..." : `Credit ₹${formData.amount || "0"}`}
            </Button>

            {result && (
              <Card className={`mt-4 ${result.success ? "border-green-500" : "border-red-500"}`}>
                <CardContent className="p-4">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserCredit;
