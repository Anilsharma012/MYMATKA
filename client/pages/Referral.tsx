import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import BASE_URL from "../src/config";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Share,
  Copy,
  Users,
  Gift,
  TrendingUp,
  Star,
  ChevronRight,
} from "lucide-react";

const Referral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    referralCode: "",
  });

  const referralLink = `${window.location.origin}/register?ref=${referralStats.referralCode}`;

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReferralStats({
            totalReferrals: data.user.referralStats.totalReferrals,
            totalEarnings: data.user.referralStats.totalEarnings,
            pendingEarnings: data.user.referralStats.pendingEarnings,
            referralCode: data.user.referralCode || "LOADING",
          });
        }
      } catch (error) {
        console.error("Error fetching referral stats:", error);
        // Fallback to default values
        setReferralStats({
          totalReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          referralCode: "ERROR",
        });
      }
    };

    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareViaWhatsApp = () => {
    const message = `Join DMatka and start earning! Use my referral code: ${referralStats.referralCode}\n${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-matka-dark p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-matka-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share className="w-8 h-8 text-matka-dark" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Share & Earn
          </h1>
          <p className="text-muted-foreground">
            Refer friends and earn ₹100 for each successful referral!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-matka-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {referralStats.totalReferrals}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Referrals
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                ₹{referralStats.totalEarnings}
              </div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="bg-gradient-to-r from-matka-gold/10 to-yellow-400/10 border-matka-gold/30 mb-6">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={referralStats.referralCode}
                readOnly
                className="text-center font-mono text-lg font-bold bg-muted/50"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(referralStats.referralCode)}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold/90"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={referralLink}
                readOnly
                className="text-xs bg-muted/50"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(referralLink)}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold/90"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Buttons */}
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardContent className="p-4 space-y-3">
            <Button
              onClick={shareViaWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Share className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>

            <Button
              onClick={() => copyToClipboard(referralLink)}
              variant="outline"
              className="w-full border-border"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Referral Link
            </Button>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-matka-gold rounded-full flex items-center justify-center text-matka-dark font-bold text-sm">
                1
              </div>
              <div>
                <div className="text-foreground font-medium">
                  Share your code
                </div>
                <div className="text-muted-foreground text-sm">
                  Send your referral code to friends
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-matka-gold rounded-full flex items-center justify-center text-matka-dark font-bold text-sm">
                2
              </div>
              <div>
                <div className="text-foreground font-medium">
                  Friend signs up
                </div>
                <div className="text-muted-foreground text-sm">
                  They register using your code
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-matka-gold rounded-full flex items-center justify-center text-matka-dark font-bold text-sm">
                3
              </div>
              <div>
                <div className="text-foreground font-medium">You both earn</div>
                <div className="text-muted-foreground text-sm">
                  ₹100 bonus for each successful referral
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referral;
