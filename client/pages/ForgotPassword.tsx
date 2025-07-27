import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || "Failed to send reset instructions");
      }
    } catch (error) {
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center px-4 relative overflow-hidden">
        {/* Pattern Background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="w-full max-w-md relative z-10">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Instructions Sent!
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Password reset instructions have been sent to your registered
                  mobile number.
                </p>
                <div className="space-y-3">
                  <Link to="/login">
                    <Button className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold hover:from-yellow-500 hover:to-matka-gold transition-all duration-300">
                      Back to Login
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="w-full border-border text-foreground hover:bg-muted"
                  >
                    Send Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matka-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Pattern Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-matka-gold via-yellow-500 to-matka-gold-dark border-3 border-matka-gold shadow-xl flex items-center justify-center">
              <span className="text-3xl">🏺</span>
            </div>
          </div>
          <h1 className="text-matka-gold text-2xl font-bold">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your mobile number to reset password
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-foreground">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter your registered mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground"
                    required
                    pattern="[6-9][0-9]{9}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                <p>
                  We'll send password reset instructions to your registered
                  mobile number via SMS.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
              >
                {loading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-matka-gold hover:text-matka-gold-light font-medium text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-matka-gold hover:text-matka-gold-light font-medium"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
