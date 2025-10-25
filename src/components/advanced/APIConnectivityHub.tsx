import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Key, 
  Activity, 
  Play, 
  Check, 
  X, 
  Clock,
  AlertTriangle,
  Code,
  Monitor,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status: 'active' | 'inactive' | 'testing';
  responseTime: number;
  lastTested: string;
  successRate: number;
  headers: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic' | 'oauth';
    value: string;
  };
}

interface APITest {
  id: string;
  endpointId: string;
  endpointName: string;
  status: 'success' | 'failed' | 'timeout';
  responseTime: number;
  statusCode: number;
  timestamp: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    size: number;
  };
}

interface APIMonitoring {
  endpointId: string;
  endpointName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastHourRequests: number;
  lastHourErrors: number;
}

export const APIConnectivityHub = () => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [tests, setTests] = useState<APITest[]>([]);
  const [monitoring, setMonitoring] = useState<APIMonitoring[]>([]);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testForm, setTestForm] = useState({
    url: '',
    method: 'GET' as const,
    headers: '{}',
    body: ''
  });

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setEndpoints([]);
    setTests([]);
    setMonitoring([]);
  }, []);

  const fetchAPIData = async () => {
    try {
      // Initialize empty data - in real app, fetch from actual API
      setEndpoints([]);
      setTests([]);
      setMonitoring([]);
    } catch (error) {
      console.error('Error fetching API data:', error);
      toast.error('Failed to load API data');
    }
  };

  const handleTestEndpoint = async (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (!endpoint) return;

    setActiveTest(endpointId);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTest: APITest = {
        id: Date.now().toString(),
        endpointId,
        endpointName: endpoint.name,
        status: Math.random() > 0.2 ? 'success' : 'failed',
        responseTime: Math.floor(Math.random() * 1000) + 100,
        statusCode: Math.random() > 0.2 ? 200 : 500,
        timestamp: new Date().toISOString(),
        request: {
          method: endpoint.method,
          url: endpoint.url,
          headers: endpoint.headers
        },
        response: {
          statusCode: Math.random() > 0.2 ? 200 : 500,
          headers: { 'content-type': 'application/json' },
          body: '{"status": "ok", "data": [...]}',
          size: Math.floor(Math.random() * 10000) + 100
        }
      };

      setTests(prev => [newTest, ...prev]);
      
      // Update endpoint status
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpointId 
          ? { ...ep, lastTested: new Date().toISOString(), responseTime: newTest.responseTime }
          : ep
      ));

      toast.success('Endpoint test completed');
    } catch (error) {
      console.error('Error testing endpoint:', error);
      toast.error('Failed to test endpoint');
    } finally {
      setActiveTest(null);
    }
  };

  const handleCustomTest = async () => {
    if (!testForm.url) {
      toast.error('Please enter a URL');
      return;
    }

    setActiveTest('custom');
    
    try {
      // Simulate custom API test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTest: APITest = {
        id: Date.now().toString(),
        endpointId: 'custom',
        endpointName: 'Custom Test',
        status: Math.random() > 0.3 ? 'success' : 'failed',
        responseTime: Math.floor(Math.random() * 1000) + 100,
        statusCode: Math.random() > 0.3 ? 200 : 404,
        timestamp: new Date().toISOString(),
        request: {
          method: testForm.method,
          url: testForm.url,
          headers: JSON.parse(testForm.headers || '{}'),
          body: testForm.body || undefined
        },
        response: {
          statusCode: Math.random() > 0.3 ? 200 : 404,
          headers: { 'content-type': 'application/json' },
          body: Math.random() > 0.3 ? '{"success": true}' : '{"error": "Not found"}',
          size: Math.floor(Math.random() * 5000) + 50
        }
      };

      setTests(prev => [newTest, ...prev]);
      toast.success('Custom test completed');
    } catch (error) {
      console.error('Error running custom test:', error);
      toast.error('Failed to run custom test');
    } finally {
      setActiveTest(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEndpointStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          API Connectivity Hub
        </h2>
        <p className="text-muted-foreground">Test, monitor, and manage API endpoints</p>
      </div>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="logs">Test Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{endpoint.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{endpoint.method}</Badge>
                            <span className={`text-sm ${getEndpointStatusColor(endpoint.status)}`}>
                              {endpoint.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTestEndpoint(endpoint.id)}
                        disabled={activeTest === endpoint.id}
                      >
                        {activeTest === endpoint.id ? (
                          <Activity className="h-3 w-3 animate-pulse mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Test
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground font-mono mb-3">
                      {endpoint.url}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Response Time</div>
                        <div>{endpoint.responseTime}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div>{endpoint.successRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Tested</div>
                        <div>{new Date(endpoint.lastTested).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Auth Type</div>
                        <div>{endpoint.authentication?.type || 'None'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom API Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={testForm.method} onValueChange={(value: any) => setTestForm(prev => ({ ...prev, method: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://api.example.com/endpoint"
                    value={testForm.url}
                    onChange={(e) => setTestForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Headers (JSON)</Label>
                  <Textarea
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    value={testForm.headers}
                    onChange={(e) => setTestForm(prev => ({ ...prev, headers: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={testForm.body}
                    onChange={(e) => setTestForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              <Button onClick={handleCustomTest} disabled={activeTest === 'custom'}>
                {activeTest === 'custom' ? (
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monitoring.map((monitor) => (
              <Card key={monitor.endpointId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Monitor className="h-4 w-4" />
                    {monitor.endpointName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-semibold text-green-600">{monitor.uptimePercentage}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                    <span className="font-semibold">{monitor.averageResponseTime}ms</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                    <span className="font-semibold">{monitor.totalRequests.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-green-600">
                      {((monitor.successfulRequests / monitor.totalRequests) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Last Hour</div>
                    <div className="flex justify-between">
                      <span className="text-sm">Requests: {monitor.lastHourRequests}</span>
                      <span className={`text-sm ${monitor.lastHourErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Errors: {monitor.lastHourErrors}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.endpointName}</span>
                        <Badge variant="outline">{test.request.method}</Badge>
                        <Badge variant={test.statusCode < 400 ? 'default' : 'destructive'}>
                          {test.statusCode}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(test.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground font-mono mb-3">
                      {test.request.url}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="ml-1 font-medium">{test.responseTime}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Size:</span>
                        <span className="ml-1 font-medium">{formatBytes(test.response.size)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`ml-1 font-medium ${test.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {test.status}
                        </span>
                      </div>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="font-medium">Response Headers:</div>
                          <pre className="bg-muted p-2 rounded text-xs">
                            {JSON.stringify(test.response.headers, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="font-medium">Response Body:</div>
                          <pre className="bg-muted p-2 rounded text-xs max-h-32 overflow-y-auto">
                            {test.response.body}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};