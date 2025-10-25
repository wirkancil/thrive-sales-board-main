import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plug, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Mail,
  Calendar,
  Phone,
  FileText,
  Database,
  Webhook,
  Key,
  Globe,
  Zap,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DataImportExport } from './DataImportExport';
import { SyncManager } from './SyncManager';
import { APIConnectivityHub } from './APIConnectivityHub';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'productivity' | 'analytics' | 'automation';
  status: 'connected' | 'available' | 'error';
  icon: React.ReactNode;
  config?: any;
  lastSync?: string;
  features: string[];
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  permissions: string[];
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  created_at: string;
}

export const IntegrationManagement = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  const fetchIntegrationData = async () => {
    setLoading(true);
    try {
      // Initialize empty data - in real app, fetch from API
      setIntegrations([]);
      setApiKeys([]);
      setWebhooks([]);
    } catch (error) {
      console.error('Error fetching integration data:', error);
      toast.error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (integrationId: string, enable: boolean) => {
    try {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: enable ? 'connected' : 'available' }
          : integration
      ));

      toast.success(`Integration ${enable ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Plug className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication':
        return <Mail className="h-4 w-4" />;
      case 'productivity':
        return <Calendar className="h-4 w-4" />;
      case 'analytics':
        return <Activity className="h-4 w-4" />;
      case 'automation':
        return <Zap className="h-4 w-4" />;
      default:
        return <Plug className="h-4 w-4" />;
    }
  };

  const maskApiKey = (key: string) => {
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary" />
            Integration Management
          </h2>
          <p className="text-muted-foreground">Connect your CRM with external tools and services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApiKeyModal(true)}>
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </Button>
          <Button variant="outline" onClick={() => setShowWebhookModal(true)}>
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API Hub</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="sync">Sync Manager</TabsTrigger>
          <TabsTrigger value="data">Data Import/Export</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Category Filters */}
          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">
              <Mail className="h-4 w-4 mr-1" />
              Communication
            </Button>
            <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Productivity
            </Button>
            <Button variant="ghost" size="sm">
              <Activity className="h-4 w-4 mr-1" />
              Analytics
            </Button>
            <Button variant="ghost" size="sm">
              <Zap className="h-4 w-4 mr-1" />
              Automation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {integration.category}
                          </Badge>
                          <div className={`text-xs ${getStatusColor(integration.status)} flex items-center gap-1`}>
                            {getStatusIcon(integration.status)}
                            {integration.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={integration.status === 'connected'}
                      onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                      disabled={integration.status === 'error'}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Features:</p>
                    {integration.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                    {integration.features.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{integration.features.length - 2} more features
                      </p>
                    )}
                  </div>
                  
                  {integration.lastSync && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <APIConnectivityHub />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">Configure webhooks for real-time event notifications</p>
            </div>
            <Button onClick={() => setShowWebhookModal(true)}>
              <Webhook className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>

          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                      <div className="flex gap-2 mt-2">
                        {webhook.events.map((event, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(webhook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Test</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <SyncManager />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataImportExport />
        </TabsContent>

        <TabsContent value="connectors" className="space-y-4">
          <div className="text-center py-12">
            <div className="p-4 bg-muted rounded-lg inline-block mb-4">
              <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">External Connectors</h3>
            <p className="text-muted-foreground mb-4">Advanced connectors for specific platforms coming soon</p>
            <Button variant="outline">Request Integration</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-name">API Key Name</Label>
                <Input id="api-name" placeholder="Enter a descriptive name" />
              </div>
              
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="read-opportunities" />
                    <label htmlFor="read-opportunities" className="text-sm">Read opportunities</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="write-activities" />
                    <label htmlFor="write-activities" className="text-sm">Write activities</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="read-contacts" />
                    <label htmlFor="read-contacts" className="text-sm">Read contacts</label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Create Key</Button>
                <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input id="webhook-name" placeholder="Enter webhook name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input id="webhook-url" placeholder="https://api.example.com/webhooks" />
              </div>
              
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="opportunity-created" />
                    <label htmlFor="opportunity-created" className="text-sm">Opportunity created</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="opportunity-closed" />
                    <label htmlFor="opportunity-closed" className="text-sm">Opportunity closed</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="activity-completed" />
                    <label htmlFor="activity-completed" className="text-sm">Activity completed</label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Create Webhook</Button>
                <Button variant="outline" onClick={() => setShowWebhookModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};