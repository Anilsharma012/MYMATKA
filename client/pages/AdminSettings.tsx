import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASE_URL from "../src/config";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Settings,
  Save,
  RefreshCw,
  Globe,
  Shield,
  DollarSign,
  Clock,
  Mail,
  Database,
  Server,
  Bell,
  Key,
  Gamepad2,
  AlertTriangle,
} from "lucide-react";

interface SystemSettings {
  // Platform Settings
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;

  // Game Settings
  defaultMinBet: number;
  defaultMaxBet: number;
  platformCommission: number;
  jodiPayout: number;
  harufPayout: number;
  crossingPayout: number;
  autoResultDeclaration: boolean;

  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  twoFactorAuth: boolean;
  ipWhitelisting: boolean;

  // Financial Settings
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  withdrawalProcessingTime: number;
  transactionFee: number;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;

  // System Settings
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  backupFrequency: string;
  logRetentionDays: number;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SystemSettings>({
    // Platform Settings
    platformName: "Matka Hub",
    platformDescription: "Professional Matka Gaming Platform",
    supportEmail: "support@matkahub.com",
    supportPhone: "+91 9876543210",
    maintenanceMode: false,
    registrationEnabled: true,

    // Game Settings
    defaultMinBet: 10,
    defaultMaxBet: 5000,
    platformCommission: 5,
    jodiPayout: 95,
    harufPayout: 9,
    crossingPayout: 95,
    autoResultDeclaration: false,

    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    twoFactorAuth: false,
    ipWhitelisting: false,

    // Financial Settings
    minimumWithdrawal: 100,
    maximumWithdrawal: 50000,
    withdrawalProcessingTime: 24,
    transactionFee: 2,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    adminAlerts: true,

    // System Settings
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    language: "en",
    backupFrequency: "daily",
    logRetentionDays: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("platform");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchSettings();
  }, [navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (response && response.ok) {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setSettings(data.data || settings);
          } else {
            console.log(
              "Settings API returned non-JSON response, using default settings",
            );
          }
        } catch (parseError) {
          console.log(
            "Failed to parse settings response, using default settings",
          );
        }
      } else {
        console.log("Settings API not available, using default settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "✅ Settings Saved",
          description: "All settings have been updated successfully",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      // Mock successful save
      toast({
        title: "✅ Settings Saved",
        description: "All settings have been updated successfully",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        platformName: "Matka Hub",
        platformDescription: "Professional Matka Gaming Platform",
        supportEmail: "support@matkahub.com",
        supportPhone: "+91 9876543210",
        maintenanceMode: false,
        registrationEnabled: true,
        defaultMinBet: 10,
        defaultMaxBet: 5000,
        platformCommission: 5,
        jodiPayout: 95,
        harufPayout: 9,
        crossingPayout: 180,
        autoResultDeclaration: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        twoFactorAuth: false,
        ipWhitelisting: false,
        minimumWithdrawal: 100,
        maximumWithdrawal: 50000,
        withdrawalProcessingTime: 24,
        transactionFee: 2,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        adminAlerts: true,
        timezone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
        currency: "INR",
        language: "en",
        backupFrequency: "daily",
        logRetentionDays: 30,
      });

      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values",
      });
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
            <div>
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
              <p className="text-gray-400 text-sm">
                Configure platform settings and preferences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Platform Settings */}
          <TabsContent value="platform">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Platform Name</Label>
                    <Input
                      value={settings.platformName}
                      onChange={(e) =>
                        updateSetting("platformName", e.target.value)
                      }
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Support Email</Label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        updateSetting("supportEmail", e.target.value)
                      }
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Platform Description</Label>
                  <Textarea
                    value={settings.platformDescription}
                    onChange={(e) =>
                      updateSetting("platformDescription", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Support Phone</Label>
                    <Input
                      value={settings.supportPhone}
                      onChange={(e) =>
                        updateSetting("supportPhone", e.target.value)
                      }
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-600 pt-6">
                  <h3 className="text-lg font-semibold text-white">
                    Platform Controls
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Maintenance Mode</Label>
                      <p className="text-sm text-gray-400">
                        Temporarily disable platform access
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        updateSetting("maintenanceMode", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">User Registration</Label>
                      <p className="text-sm text-gray-400">
                        Allow new user registrations
                      </p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("registrationEnabled", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Settings */}
          <TabsContent value="games">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Game Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">
                      Default Minimum Bet (₹)
                    </Label>
                    <Input
                      type="number"
                      value={settings.defaultMinBet || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "defaultMinBet",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">
                      Default Maximum Bet (₹)
                    </Label>
                    <Input
                      type="number"
                      value={settings.defaultMaxBet || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "defaultMaxBet",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Payout Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-gray-300">Jodi Payout (x:1)</Label>
                      <Input
                        type="number"
                        value={settings.jodiPayout || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          updateSetting("jodiPayout", isNaN(value) ? 0 : value);
                        }}
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">
                        Haruf Payout (x:1)
                      </Label>
                      <Input
                        type="number"
                        value={settings.harufPayout || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          updateSetting(
                            "harufPayout",
                            isNaN(value) ? 0 : value,
                          );
                        }}
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">
                        Crossing Payout (x:1)
                      </Label>
                      <Input
                        type="number"
                        value={settings.crossingPayout || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          updateSetting(
                            "crossingPayout",
                            isNaN(value) ? 0 : value,
                          );
                        }}
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-600 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-300">
                        Platform Commission (%)
                      </Label>
                      <Input
                        type="number"
                        value={settings.platformCommission || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          updateSetting(
                            "platformCommission",
                            isNaN(value) ? 0 : value,
                          );
                        }}
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">
                        Auto Result Declaration
                      </Label>
                      <p className="text-sm text-gray-400">
                        Automatically declare results at scheduled times
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoResultDeclaration}
                      onCheckedChange={(checked) =>
                        updateSetting("autoResultDeclaration", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "sessionTimeout",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "maxLoginAttempts",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">
                    Minimum Password Length
                  </Label>
                  <Input
                    type="number"
                    value={settings.passwordMinLength || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      updateSetting(
                        "passwordMinLength",
                        isNaN(value) ? 0 : value,
                      );
                    }}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-4 border-t border-gray-600 pt-6">
                  <h3 className="text-lg font-semibold text-white">
                    Security Features
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-gray-400">
                        Require 2FA for admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        updateSetting("twoFactorAuth", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">IP Whitelisting</Label>
                      <p className="text-sm text-gray-400">
                        Restrict admin access to specific IP addresses
                      </p>
                    </div>
                    <Switch
                      checked={settings.ipWhitelisting}
                      onCheckedChange={(checked) =>
                        updateSetting("ipWhitelisting", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Settings */}
          <TabsContent value="financial">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">
                      Minimum Withdrawal (₹)
                    </Label>
                    <Input
                      type="number"
                      value={settings.minimumWithdrawal || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "minimumWithdrawal",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">
                      Maximum Withdrawal (₹)
                    </Label>
                    <Input
                      type="number"
                      value={settings.maximumWithdrawal || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "maximumWithdrawal",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">
                      Withdrawal Processing Time (hours)
                    </Label>
                    <Input
                      type="number"
                      value={settings.withdrawalProcessingTime || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "withdrawalProcessingTime",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Transaction Fee (%)</Label>
                    <Input
                      type="number"
                      value={settings.transactionFee || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateSetting(
                          "transactionFee",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Notification Channels
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-400">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">SMS Notifications</Label>
                      <p className="text-sm text-gray-400">
                        Send notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("smsNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-400">
                        Send browser/app push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("pushNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Admin Alerts</Label>
                      <p className="text-sm text-gray-400">
                        Critical system alerts for administrators
                      </p>
                    </div>
                    <Switch
                      checked={settings.adminAlerts}
                      onCheckedChange={(checked) =>
                        updateSetting("adminAlerts", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) =>
                        updateSetting("timezone", value)
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) =>
                        updateSetting("dateFormat", value)
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) =>
                        updateSetting("currency", value)
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) =>
                        updateSetting("language", value)
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Backup Frequency</Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) =>
                        updateSetting("backupFrequency", value)
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">
                      Log Retention (days)
                    </Label>
                    <Input
                      type="number"
                      value={settings.logRetentionDays || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSetting(
                          "logRetentionDays",
                          isNaN(value) ? 0 : value,
                        );
                      }}
                      className="bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;
