import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, User, Mail, Smartphone, Lock, Gift } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    setLoading(false);
    return;
  }

  try {
    // Runtime validation to catch configuration issues
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('.fly.dev') || !hostname.includes('localhost');

    if (isProduction && BASE_URL.includes('localhost')) {
      console.error('❌ CRITICAL: Localhost URL detected in production environment!');
      console.error('   Hostname:', hostname);
      console.error('   BASE_URL:', BASE_URL);
      console.error('   This will cause network errors. Please check configuration.');
      setError('Configuration error: Invalid API endpoint. Please contact support.');
      setLoading(false);
      return;
    }

    console.log('🔐 Registration attempt:', {
      hostname,
      isProduction,
      BASE_URL,
      endpoint: `${BASE_URL}/api/auth/register`,
      formData: {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        hasPassword: !!formData.password,
        referralCode: formData.referralCode
      }
    });

    const result: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${BASE_URL}/api/auth/register`;
      console.log('🌐 Making registration request to:', url);
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        console.log('📡 Registration response received:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText.substring(0, 200) + '...'
        });

        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            status: xhr.status,
            data,
            ok: xhr.status >= 200 && xhr.status < 300,
          });
        } catch (parseError) {
          console.error('❌ Failed to parse registration response:', parseError);
          reject(new Error(`Invalid response format: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        console.error('❌ Registration XHR error:', {
          readyState: xhr.readyState,
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText
        });
        reject(new Error(`Network error: Unable to connect to ${url}. Please check your connection and try again.`));
      };

      xhr.ontimeout = () => {
        console.error('❌ Registration timeout');
        reject(new Error("Request timeout: The server is taking too long to respond."));
      };

      // Set timeout
      xhr.timeout = 30000; // 30 seconds

      xhr.send(
        JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          password: formData.password,
          ...(formData.referralCode && {
            referralCode: formData.referralCode.trim(),
          }),
        })
      );
    });

    if (result.ok) {
      login(result.data.token, result.data.user);
      navigate("/dashboard");
    } else {
      setError(result.data.message || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("Unable to connect to server. Please try again later.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-matka-dark flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Pattern Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-matka-gold via-yellow-500 to-matka-gold-dark border-2 border-matka-gold shadow-xl flex items-center justify-center">
              <span className="text-2xl">🏺</span>
            </div>
          </div>
          <h1 className="text-matka-gold text-xl font-bold">Join Matka Hub</h1>
          <p className="text-gray-400 text-sm">
            Create your account and start playing
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-foreground text-lg">
              Create Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-foreground text-sm">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10 bg-input border-border text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-foreground text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-input border-border text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mobile" className="text-foreground text-sm">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="pl-10 bg-input border-border text-foreground"
                    required
                    pattern="[6-9][0-9]{9}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-foreground text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-input border-border text-foreground"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="confirmPassword"
                  className="text-foreground text-sm"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-input border-border text-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="referralCode"
                  className="text-foreground text-sm"
                >
                  Referral Code{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-matka-gold hover:text-matka-gold-light font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to Welcome
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
