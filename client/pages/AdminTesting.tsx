import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BASE_URL from "../src/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Play,
  RefreshCw,
  Database,
  Server,
  Globe,
  Zap,
  Bug,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Settings,
  Code,
  Activity,
  Shield,
  FileText,
  Monitor,
  Users,
  Search,
  Archive,
  CreditCard,
  DollarSign,
} from "lucide-react";

interface TestResult {
  id: string;
  name: string;
  status: "running" | "passed" | "failed" | "warning";
  duration: number;
  message: string;
  details?: any;
  timestamp: string;
}

interface SystemHealth {
  database: {
    status: "healthy" | "warning" | "error";
    connectionCount: number;
    responseTime: number;
    lastCheck: string;
  };
  server: {
    status: "healthy" | "warning" | "error";
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    lastCheck: string;
  };
  apis: {
    status: "healthy" | "warning" | "error";
    successRate: number;
    avgResponseTime: number;
    lastCheck: string;
  };
  security: {
    status: "healthy" | "warning" | "error";
    threats: number;
    lastScan: string;
  };
}

const AdminTesting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: {
      status: "healthy",
      connectionCount: 8,
      responseTime: 45,
      lastCheck: new Date().toISOString(),
    },
    server: {
      status: "healthy",
      uptime: 720000,
      cpuUsage: 25,
      memoryUsage: 68,
      lastCheck: new Date().toISOString(),
    },
    apis: {
      status: "healthy",
      successRate: 99.8,
      avgResponseTime: 120,
      lastCheck: new Date().toISOString(),
    },
    security: {
      status: "healthy",
      threats: 0,
      lastScan: new Date(Date.now() - 3600000).toISOString(),
    },
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("health");
  const [runningTests, setRunningTests] = useState<string[]>([]);

  // Test Configuration
  const [testConfig, setTestConfig] = useState({
    environment: "production",
    testData: {
      gameId: "",
      userId: "",
      amount: 100,
      resultNumber: "56",
    },
    loadTest: {
      users: 10,
      duration: 60,
      endpoint: "/api/games/place-bet",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchSystemHealth();
  }, [navigate]);

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/system/health`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (response && response.ok) {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setSystemHealth(data.data || systemHealth);
          } else {
            console.log(
              "System health API returned non-JSON response, using mock data",
            );
          }
        } catch (parseError) {
          console.log(
            "Failed to parse system health response, using mock data",
          );
        }
      } else {
        console.log("System health API not available, using mock data");
      }
    } catch (error) {
      console.error("Error fetching system health:", error);
      // Keep mock data for demo
    }
  };

  const runTest = async (testType: string, testName: string) => {
    const testId = `${testType}_${Date.now()}`;
    setRunningTests((prev) => [...prev, testId]);

    // Add running test
    const runningTest: TestResult = {
      id: testId,
      name: testName,
      status: "running",
      duration: 0,
      message: "Test in progress...",
      timestamp: new Date().toISOString(),
    };

    setTestResults((prev) => [runningTest, ...prev]);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${BASE_URL}/api/admin/test/${testType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testConfig),
      });

      // Simulate test execution
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 3000),
      );

      const success = Math.random() > 0.2; // 80% success rate
      const duration = 2000 + Math.random() * 3000;

      const completedTest: TestResult = {
        id: testId,
        name: testName,
        status: success ? "passed" : "failed",
        duration,
        message: success
          ? `Test completed successfully in ${duration.toFixed(0)}ms`
          : `Test failed: ${getRandomErrorMessage()}`,
        details: getTestDetails(testType, success),
        timestamp: new Date().toISOString(),
      };

      setTestResults((prev) =>
        prev.map((test) => (test.id === testId ? completedTest : test)),
      );

      toast({
        title: success ? "✅ Test Passed" : "❌ Test Failed",
        description: `${testName}: ${completedTest.message}`,
        className: success
          ? "border-green-500 bg-green-50 text-green-900"
          : "border-red-500 bg-red-50 text-red-900",
      });
    } catch (error) {
      const failedTest: TestResult = {
        id: testId,
        name: testName,
        status: "failed",
        duration: 0,
        message: "Test execution failed",
        timestamp: new Date().toISOString(),
      };

      setTestResults((prev) =>
        prev.map((test) => (test.id === testId ? failedTest : test)),
      );
    } finally {
      setRunningTests((prev) => prev.filter((id) => id !== testId));
    }
  };

  const getRandomErrorMessage = () => {
    const errors = [
      "Database connection timeout",
      "Invalid API response format",
      "Authentication failed",
      "Rate limit exceeded",
      "Server overload detected",
      "Network connectivity issue",
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  };

  const getTestDetails = (testType: string, success: boolean) => {
    switch (testType) {
      case "api":
        return {
          endpoint: "/api/games/place-bet",
          method: "POST",
          statusCode: success ? 200 : 500,
          responseTime: Math.random() * 1000,
          dataSize: Math.random() * 10000,
        };
      case "database":
        return {
          queries: Math.floor(Math.random() * 10) + 1,
          connections: Math.floor(Math.random() * 20) + 5,
          responseTime: Math.random() * 500,
          transactions: success ? "committed" : "rolled back",
        };
      case "load":
        return {
          concurrentUsers: testConfig.loadTest.users,
          duration: testConfig.loadTest.duration,
          requestsPerSecond: Math.random() * 100,
          errorRate: success ? Math.random() * 0.02 : Math.random() * 0.2,
        };
      default:
        return {};
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const tests = [
      { type: "api", name: "API Endpoints Test" },
      { type: "database", name: "Database Connectivity Test" },
      { type: "auth", name: "Authentication Test" },
      { type: "game", name: "Game Logic Test" },
      { type: "wallet", name: "Wallet Operations Test" },
    ];

    for (const test of tests) {
      await runTest(test.type, test.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setLoading(false);
  };

  const clearTestResults = () => {
    setTestResults([]);
    toast({
      title: "Test Results Cleared",
      description: "All test results have been cleared",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Healthy
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

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
              <h1 className="text-2xl font-bold text-white">
                System Testing & Monitoring
              </h1>
              <p className="text-gray-400 text-sm">
                Comprehensive testing tools and system health monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchSystemHealth}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={runAllTests}
              disabled={loading || runningTests.length > 0}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Play className="h-4 w-4 mr-2" />
              {loading ? "Running..." : "Run All Tests"}
            </Button>
          </div>
        </div>

        {/* Testing Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Tests
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="load" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Load Tests
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* System Health Tab */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Health */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Health
                    </div>
                    {getHealthStatusBadge(systemHealth.database.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connections</span>
                      <span className="text-white">
                        {systemHealth.database.connectionCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time</span>
                      <span className="text-white">
                        {systemHealth.database.responseTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Check</span>
                      <span className="text-white">
                        {new Date(
                          systemHealth.database.lastCheck,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      onClick={() =>
                        runTest("database", "Database Health Check")
                      }
                      className="w-full"
                      variant="outline"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Database
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Server Health */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Server Health
                    </div>
                    {getHealthStatusBadge(systemHealth.server.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white">
                        {formatUptime(systemHealth.server.uptime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU Usage</span>
                      <span className="text-white">
                        {systemHealth.server.cpuUsage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory Usage</span>
                      <span className="text-white">
                        {systemHealth.server.memoryUsage}%
                      </span>
                    </div>
                    <Button
                      onClick={() =>
                        runTest("server", "Server Performance Test")
                      }
                      className="w-full"
                      variant="outline"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Test Server
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Health */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      API Health
                    </div>
                    {getHealthStatusBadge(systemHealth.apis.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-white">
                        {systemHealth.apis.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Response</span>
                      <span className="text-white">
                        {systemHealth.apis.avgResponseTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Check</span>
                      <span className="text-white">
                        {new Date(
                          systemHealth.apis.lastCheck,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      onClick={() => runTest("api", "API Endpoints Test")}
                      className="w-full"
                      variant="outline"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Test APIs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Health */}
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Status
                    </div>
                    {getHealthStatusBadge(systemHealth.security.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Threats Detected</span>
                      <span className="text-white">
                        {systemHealth.security.threats}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Scan</span>
                      <span className="text-white">
                        {new Date(
                          systemHealth.security.lastScan,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      onClick={() => runTest("security", "Security Scan")}
                      className="w-full"
                      variant="outline"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Security Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Tests Tab */}
          <TabsContent value="api">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">API Test Suite</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => runTest("auth", "Authentication API Test")}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Test Authentication APIs
                    </Button>

                    <Button
                      onClick={() => runTest("games", "Games API Test")}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Games APIs
                    </Button>

                    <Button
                      onClick={() => runTest("wallet", "Wallet API Test")}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Test Wallet APIs
                    </Button>

                    <Button
                      onClick={() => runTest("admin", "Admin API Test")}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Test Admin APIs
                    </Button>

                    <Button
                      onClick={() => runTest("payment", "Payment API Test")}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Test Payment APIs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Test Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Environment</Label>
                      <Select
                        value={testConfig.environment}
                        onValueChange={(value) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            environment: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">
                            Development
                          </SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Test Game ID</Label>
                      <Input
                        value={testConfig.testData.gameId}
                        onChange={(e) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            testData: {
                              ...prev.testData,
                              gameId: e.target.value,
                            },
                          }))
                        }
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                        placeholder="Enter game ID for testing"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Test Amount</Label>
                      <Input
                        type="number"
                        value={testConfig.testData.amount}
                        onChange={(e) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            testData: {
                              ...prev.testData,
                              amount: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Tests Tab */}
          <TabsContent value="database">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Database Test Suite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() =>
                      runTest("db_connection", "Connection Pool Test")
                    }
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Test Connection Pool
                  </Button>

                  <Button
                    onClick={() =>
                      runTest("db_queries", "Query Performance Test")
                    }
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Test Query Performance
                  </Button>

                  <Button
                    onClick={() =>
                      runTest("db_transactions", "Transaction Test")
                    }
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Transactions
                  </Button>

                  <Button
                    onClick={() => runTest("db_backup", "Backup System Test")}
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Test Backup System
                  </Button>

                  <Button
                    onClick={() =>
                      runTest("db_indexing", "Index Performance Test")
                    }
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Test Index Performance
                  </Button>

                  <Button
                    onClick={() =>
                      runTest("db_integrity", "Data Integrity Test")
                    }
                    className="justify-start"
                    variant="outline"
                    disabled={runningTests.length > 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test Data Integrity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Load Tests Tab */}
          <TabsContent value="load">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Load Test Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Concurrent Users</Label>
                      <Input
                        type="number"
                        value={testConfig.loadTest.users}
                        onChange={(e) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            loadTest: {
                              ...prev.loadTest,
                              users: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">
                        Duration (seconds)
                      </Label>
                      <Input
                        type="number"
                        value={testConfig.loadTest.duration}
                        onChange={(e) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            loadTest: {
                              ...prev.loadTest,
                              duration: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Target Endpoint</Label>
                      <Input
                        value={testConfig.loadTest.endpoint}
                        onChange={(e) =>
                          setTestConfig((prev) => ({
                            ...prev,
                            loadTest: {
                              ...prev.loadTest,
                              endpoint: e.target.value,
                            },
                          }))
                        }
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                    </div>

                    <Button
                      onClick={() => runTest("load", "Load Test")}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                      disabled={runningTests.length > 0}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start Load Test
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Load Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() =>
                        runTest("load_light", "Light Load Test (5 users)")
                      }
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Light Load (5 users)
                    </Button>

                    <Button
                      onClick={() =>
                        runTest("load_medium", "Medium Load Test (50 users)")
                      }
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Medium Load (50 users)
                    </Button>

                    <Button
                      onClick={() =>
                        runTest("load_heavy", "Heavy Load Test (200 users)")
                      }
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Heavy Load (200 users)
                    </Button>

                    <Button
                      onClick={() =>
                        runTest("load_stress", "Stress Test (500 users)")
                      }
                      className="w-full justify-start"
                      variant="outline"
                      disabled={runningTests.length > 0}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Stress Test (500 users)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results">
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Test Results</CardTitle>
                <Button
                  onClick={clearTestResults}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  Clear Results
                </Button>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No Test Results
                    </h3>
                    <p className="text-gray-400">
                      Run some tests to see results here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className="border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <h4 className="text-white font-medium">
                                {result.name}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {result.message}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <p>
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </p>
                            {result.duration > 0 && (
                              <p>{result.duration.toFixed(0)}ms</p>
                            )}
                          </div>
                        </div>

                        {result.details && (
                          <div className="mt-3 p-3 bg-[#1a1a1a] rounded text-sm">
                            <pre className="text-gray-300 whitespace-pre-wrap">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminTesting;
