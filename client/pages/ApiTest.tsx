import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BASE_URL from "../src/config";

const ApiTest = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const testEndpoint = async (endpoint: string, method = 'GET', body?: any) => {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`Testing ${method} ${url}`);
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      addResult(`${method} ${endpoint}`, response.ok, {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
    } catch (error) {
      addResult(`${method} ${endpoint}`, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    // Test basic connectivity
    await testEndpoint('/api/ping');
    await testEndpoint('/api/test');
    await testEndpoint('/api/auth/health');
    
    // Test admin login with invalid credentials (should return 401, not network error)
    await testEndpoint('/api/auth/admin-login', 'POST', {
      mobile: '1234567890',
      password: 'test'
    });

    // Test registration with invalid data (should return 400, not network error)
    await testEndpoint('/api/auth/register', 'POST', {
      fullName: 'Test User',
      email: 'test@example.com',
      mobile: '1234567890',
      password: 'test123'
    });

    // Test fix user winning (for debugging wallet issues)
    await testEndpoint('/api/test/fix-user-winning', 'POST', {
      userId: '6884b27dc3bbb7dd57828479'
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">API Connectivity Test</CardTitle>
            <p className="text-gray-400">
              Test API connectivity between frontend and backend
            </p>
            <div className="text-sm text-gray-500">
              <p>BASE_URL: "{BASE_URL || 'same-origin'}"</p>
              <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={loading}
              className="mb-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Running Tests...' : 'Run API Tests'}
            </Button>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={`border ${result.success ? 'border-green-500' : 'border-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{result.test}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiTest;
