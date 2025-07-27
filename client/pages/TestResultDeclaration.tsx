import { useState } from "react";
import { Button } from "@/components/ui/button";
import BASE_URL from "../src/config";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestResultDeclaration = () => {
  const [gameName, setGameName] = useState("Kalyan");
  const [result, setResult] = useState("02");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const declareResult = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/test/declare-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName,
          result,
        }),
      });

      const data = await response.json();
      setResponse(data);
      console.log("Result:", data);
    } catch (error) {
      console.error("Error:", error);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-matka-dark p-6">
      <div className="container mx-auto max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              🧪 Test Result Declaration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-foreground block mb-2">Game Name:</label>
              <Input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-foreground block mb-2">Result:</label>
              <Input
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              onClick={declareResult}
              disabled={loading}
              className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
            >
              {loading ? "Declaring..." : "🎯 Declare Result"}
            </Button>

            {response && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-muted-foreground">
              <p>📋 Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter game name (e.g., "Kalyan")</li>
                <li>Enter result number (e.g., "02")</li>
                <li>Click "Declare Result"</li>
                <li>Check browser console and response for details</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestResultDeclaration;
