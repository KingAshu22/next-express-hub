// app/(dashboard)/api-docs/page.jsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Check,
  Code,
  Key,
  Send,
  Terminal,
  FileJson,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Play,
  Loader2,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

// ==================== CODE BLOCK COMPONENT ====================
const CodeBlock = ({ code, language = "json", title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          <Badge variant="secondary" className="text-xs">{language}</Badge>
        </div>
      )}
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== API TESTER COMPONENT ====================
const ApiTester = ({ userEmail }) => {
  const [formData, setFormData] = useState({
    email: userEmail || "",
    password: "",
    trackingNumber: "",
    userType: "client",
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleTest = async () => {
    if (!formData.email || !formData.password || !formData.trackingNumber) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResponse(null);
    setError(null);
    setFormData({
      ...formData,
      password: "",
      trackingNumber: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Email</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-password">Password</Label>
          <div className="relative">
            <Input
              id="test-password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-tracking">Tracking Number</Label>
          <Input
            id="test-tracking"
            placeholder="TRK123456789"
            value={formData.trackingNumber}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-userType">User Type</Label>
          <select
            id="test-userType"
            className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          >
            <option value="client">Client</option>
            <option value="franchise">Franchise</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleTest} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Send Request
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {response && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Response</Label>
            <Badge variant={response.success ? "default" : "destructive"}>
              {response.success ? "Success" : "Failed"}
            </Badge>
          </div>
          <CodeBlock
            code={JSON.stringify(response, null, 2)}
            language="json"
          />
        </div>
      )}
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  
  // You can get this from your auth context/session
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com";

  const requestParameters = [
    { name: "email", type: "string", required: true, description: "Your registered email address" },
    { name: "password", type: "string", required: true, description: "Your account password" },
    { name: "trackingNumber", type: "string", required: true, description: "The tracking number to look up" },
    { name: "userType", type: "string", required: false, description: "'client' or 'franchise' (default: 'client')" },
  ];

  const errorCodes = [
    { code: "400", description: "Missing required fields or invalid userType" },
    { code: "401", description: "Invalid email or password" },
    { code: "404", description: "Tracking number does not exist" },
    { code: "500", description: "Internal server error" },
  ];

  // Code Examples
  const curlExample = `curl -X POST ${baseUrl}/api/tracking \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "your@email.com",
    "password": "your_password",
    "trackingNumber": "TRK123456789",
    "userType": "client"
  }'`;

  const javascriptExample = `async function getTracking(trackingNumber) {
  const response = await fetch('${baseUrl}/api/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'your@email.com',
      password: 'your_password',
      trackingNumber: trackingNumber,
      userType: 'client'
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Status:', data.data.currentStatus);
    return data.data;
  } else {
    throw new Error(data.error);
  }
}`;

  const pythonExample = `import requests

def get_tracking(tracking_number):
    response = requests.post(
        "${baseUrl}/api/tracking",
        json={
            "email": "your@email.com",
            "password": "your_password",
            "trackingNumber": tracking_number,
            "userType": "client"
        }
    )
    
    data = response.json()
    
    if data.get("success"):
        return data["data"]
    else:
        raise Exception(data.get("error"))`;

  const phpExample = `<?php
$response = file_get_contents('${baseUrl}/api/tracking', false, 
  stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => 'Content-Type: application/json',
      'content' => json_encode([
        'email' => 'your@email.com',
        'password' => 'your_password',
        'trackingNumber' => 'TRK123456789',
        'userType' => 'client'
      ])
    ]
  ])
);

$data = json_decode($response, true);
print_r($data);
?>`;

  const successResponse = `{
  "success": true,
  "data": {
    "trackingNumber": "TRK123456789",
    "currentStatus": "In Transit",
    "lastUpdate": "25 November 2025, 06:30 PM",
    "origin": "India",
    "destination": "United States",
    "sender": {
      "name": "John Doe",
      "address": "123 Main St, Mumbai",
      "country": "India"
    },
    "receiver": {
      "name": "Jane Smith",
      "address": "456 Oak Ave, New York",
      "country": "United States"
    },
    "forwardingNumber": "FWD987654321",
    "forwardingLink": "https://partner.com/track/FWD987654321",
    "timeline": [
      {
        "status": "In Transit",
        "timestamp": "25 November 2025, 06:30 PM",
        "location": "Mumbai Hub",
        "comment": null
      },
      {
        "status": "Package Received",
        "timestamp": "24 November 2025, 10:00 AM",
        "location": "Mumbai Facility",
        "comment": "Picked up from sender"
      }
    ]
  }
}`;

  const sections = [
    { id: "overview", label: "Overview", icon: FileJson },
    { id: "endpoint", label: "Endpoint", icon: Terminal },
    { id: "parameters", label: "Parameters", icon: Key },
    { id: "response", label: "Response", icon: Code },
    { id: "examples", label: "Code Examples", icon: Code },
    { id: "errors", label: "Error Codes", icon: AlertCircle },
    { id: "playground", label: "Test API", icon: Play },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <Badge>v1.0</Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Integrate tracking functionality into your applications using our REST API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Overview Section */}
          {activeSection === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-blue-500" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Getting started with the Tracking API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Base URL</p>
                    <code className="text-sm font-mono text-blue-600 break-all">
                      {baseUrl}/api/tracking
                    </code>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Method</p>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">POST</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Content Type</p>
                    <code className="text-sm font-mono">application/json</code>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Quick Start</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Use your login credentials</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Use the same email and password you use to log in to this dashboard.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Send a POST request</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Include your credentials and tracking number in the request body.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Parse the JSON response</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          The API returns tracking details including status and timeline.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security</AlertTitle>
                  <AlertDescription>
                    Always use HTTPS and keep your credentials secure. Never expose them in client-side code.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Endpoint Section */}
          {activeSection === "endpoint" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-500" />
                  API Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Badge className="bg-green-500 hover:bg-green-500">POST</Badge>
                  <code className="font-mono text-sm break-all">{baseUrl}/api/tracking</code>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Request Headers</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <code className="text-sm">Content-Type: application/json</code>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Example Request</h4>
                  <CodeBlock
                    code={`POST /api/tracking HTTP/1.1
Host: ${baseUrl.replace('https://', '').replace('http://', '')}
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "your_password",
  "trackingNumber": "TRK123456789",
  "userType": "client"
}`}
                    language="http"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parameters Section */}
          {activeSection === "parameters" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-500" />
                  Request Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-semibold">Parameter</th>
                        <th className="text-left py-3 px-2 font-semibold">Type</th>
                        <th className="text-left py-3 px-2 font-semibold">Required</th>
                        <th className="text-left py-3 px-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestParameters.map((param, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-2">
                            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                              {param.name}
                            </code>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {param.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {param.required ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Optional</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                            {param.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Example Request Body</h4>
                  <CodeBlock
                    code={`{
  "email": "your@email.com",
  "password": "your_password",
  "trackingNumber": "TRK123456789",
  "userType": "client"
}`}
                    language="json"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Section */}
          {activeSection === "response" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-500" />
                  Response Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="success">
                  <TabsList>
                    <TabsTrigger value="success">Success Response</TabsTrigger>
                    <TabsTrigger value="error">Error Response</TabsTrigger>
                  </TabsList>
                  <TabsContent value="success" className="mt-4">
                    <CodeBlock code={successResponse} language="json" title="200 OK" />
                  </TabsContent>
                  <TabsContent value="error" className="mt-4">
                    <CodeBlock
                      code={`{
  "success": false,
  "error": "Invalid credentials"
}`}
                      language="json"
                      title="401 Unauthorized"
                    />
                  </TabsContent>
                </Tabs>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Response Fields</h4>
                  <div className="space-y-3">
                    {[
                      { field: "success", desc: "Boolean indicating request success" },
                      { field: "data.trackingNumber", desc: "The tracking number queried" },
                      { field: "data.currentStatus", desc: "Current status of the parcel" },
                      { field: "data.lastUpdate", desc: "Timestamp of last update" },
                      { field: "data.origin", desc: "Origin location" },
                      { field: "data.destination", desc: "Destination location" },
                      { field: "data.sender", desc: "Sender details object" },
                      { field: "data.receiver", desc: "Receiver details object" },
                      { field: "data.timeline", desc: "Array of tracking events" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {item.field}
                        </code>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code Examples Section */}
          {activeSection === "examples" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-500" />
                  Code Examples
                </CardTitle>
                <CardDescription>
                  Copy and paste these examples into your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl">
                  <TabsList className="flex-wrap">
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="php">PHP</TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl" className="mt-4">
                    <CodeBlock code={curlExample} language="bash" title="cURL" />
                  </TabsContent>
                  <TabsContent value="javascript" className="mt-4">
                    <CodeBlock code={javascriptExample} language="javascript" title="JavaScript (Fetch)" />
                  </TabsContent>
                  <TabsContent value="python" className="mt-4">
                    <CodeBlock code={pythonExample} language="python" title="Python (Requests)" />
                  </TabsContent>
                  <TabsContent value="php" className="mt-4">
                    <CodeBlock code={phpExample} language="php" title="PHP" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Error Codes Section */}
          {activeSection === "errors" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Error Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorCodes.map((err, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <Badge
                        variant="outline"
                        className={
                          err.code === "400"
                            ? "border-yellow-500 text-yellow-700"
                            : err.code === "401"
                            ? "border-red-500 text-red-700"
                            : err.code === "404"
                            ? "border-orange-500 text-orange-700"
                            : "border-red-500 text-red-700"
                        }
                      >
                        {err.code}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {err.description}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Error Response Examples</h4>
                  <CodeBlock
                    code={`{
  "success": false,
  "error": "Missing required fields: email, password, trackingNumber"
}`}
                    language="json"
                    title="400 Bad Request"
                  />
                  <CodeBlock
                    code={`{
  "success": false,
  "error": "Tracking number not found"
}`}
                    language="json"
                    title="404 Not Found"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Playground Section */}
          {activeSection === "playground" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-500" />
                  Test API
                </CardTitle>
                <CardDescription>
                  Test the API directly from here using your credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Use your login credentials to test the API. The tracking number must exist in the system.
                  </AlertDescription>
                </Alert>
                <ApiTester />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}