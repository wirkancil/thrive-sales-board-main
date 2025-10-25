import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  RefreshCw as Sync, 
  CheckCircle,
  AlertTriangle, 
  Clock,
  Pause,
  Play,
  Settings,
  Activity,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncConnection {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  status: 'active' | 'paused' | 'error' | 'disconnected';
  lastSync: string;
  nextSync: string;
  syncFrequency: 'real-time' | '5min' | '15min' | '1hour' | '4hours' | '24hours';
  direction: 'bidirectional' | 'inbound' | 'outbound';
  dataTypes: string[];
  recordsProcessed: number;
  errors: number;
  isOnline: boolean;
}

interface SyncActivity {
  id: string;
  connectionId: string;
  connectionName: string;
  type: 'full' | 'incremental' | 'manual';
  status: 'success' | 'failed' | 'partial';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSkipped: number;
  errors: number;
  details: string;
}

interface SyncConflict {
  id: string;
  connectionId: string;
  recordType: string;
  recordId: string;
  localValue: any;
  remoteValue: any;
  conflictField: string;
  createdAt: string;
  resolved: boolean;
}

export const SyncManager = () => {
  const [connections, setConnections] = useState<SyncConnection[]>([]);
  const [activities, setActivities] = useState<SyncActivity[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSync, setActiveSync] = useState<string | null>(null);

  useEffect(() => {
    const fetchSyncData = async () => {
      setLoading(true);
      try {
        // Initialize empty data - in real app, fetch from API
        setConnections([]);
        setActivities([]);
        setConflicts([]);
      } catch (error) {
        console.error('Error fetching sync data:', error);
        toast.error('Failed to load sync data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSyncData();
  }, []);



  const handleRefresh = () => {
    setLoading(true);
    // In real app, this would refetch data from API
    setTimeout(() => {
      setLoading(false);
      toast.success('Data refreshed');
    }, 1000);
  };

  const handleToggleConnection = async (connectionId: string, enabled: boolean) => {
    try {
      setConnections(prev => prev.map(conn =>
        conn.id === connectionId
          ? { ...conn, status: enabled ? 'active' : 'paused' }
          : conn
      ));
      toast.success(`Connection ${enabled ? 'enabled' : 'paused'}`);
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast.error('Failed to update connection');
    }
  };

  const handleManualSync = async (connectionId: string) => {
    try {
      setActiveSync(connectionId);
      
      // Create new activity
      const newActivity: SyncActivity = {
        id: Date.now().toString(),
        connectionId,
        connectionName: connections.find(c => c.id === connectionId)?.name || 'Unknown',
        type: 'manual',
        status: 'success',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2000).toISOString(),
        recordsProcessed: Math.floor(Math.random() * 100) + 10,
        recordsSkipped: Math.floor(Math.random() * 5),
        errors: 0,
        details: 'Manual sync completed successfully'
      };

      // Update last sync time
      setConnections(prev => prev.map(conn =>
        conn.id === connectionId
          ? { ...conn, lastSync: new Date().toISOString() }
          : conn
      ));

      // Add activity after delay
      setTimeout(() => {
        setActivities(prev => [newActivity, ...prev]);
        setActiveSync(null);
        toast.success('Manual sync completed');
      }, 2000);

    } catch (error) {
      console.error('Error starting manual sync:', error);
      toast.error('Failed to start sync');
      setActiveSync(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'partial':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimeDiff = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
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
            <Sync className="h-6 w-6 text-primary" />
            Sync Manager
          </h2>
          <p className="text-muted-foreground">Monitor and manage real-time data synchronization</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {connections.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {connections.reduce((sum, c) => sum + c.errors, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {connections.reduce((sum, c) => sum + c.recordsProcessed, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Records Synced</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {connection.name}
                        {connection.isOnline ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-500" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {connection.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {connection.direction}
                        </Badge>
                        <div className={`text-xs flex items-center gap-1`}>
                          {getStatusIcon(connection.status)}
                          {connection.status}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={connection.status === 'active'}
                      onCheckedChange={(checked) => handleToggleConnection(connection.id, checked)}
                      disabled={activeSync === connection.id}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualSync(connection.id)}
                      disabled={activeSync === connection.id}
                    >
                      {activeSync === connection.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Last Sync</div>
                    <div>{formatTimeDiff(connection.lastSync)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Frequency</div>
                    <div>{connection.syncFrequency}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Records</div>
                    <div>{connection.recordsProcessed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Errors</div>
                    <div className={connection.errors > 0 ? 'text-red-600' : ''}>
                      {connection.errors}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Data Types:</div>
                  <div className="flex gap-1">
                    {connection.dataTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Sync Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm ${getStatusColor(activity.status)}`}>
                      {activity.status === 'success' && <CheckCircle className="h-4 w-4" />}
                      {activity.status === 'failed' && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">{activity.connectionName}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeDiff(activity.startTime)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                
                <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-muted-foreground">
                  <div>Processed: {activity.recordsProcessed}</div>
                  <div>Skipped: {activity.recordsSkipped}</div>
                  <div>Errors: {activity.errors}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Sync Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="border rounded-lg p-3 bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{conflict.recordType} #{conflict.recordId}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Field: {conflict.conflictField}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Use Local</Button>
                      <Button size="sm" variant="outline">Use Remote</Button>
                      <Button size="sm">Merge</Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Local Value:</div>
                      <pre className="text-xs bg-white p-2 rounded border">
                        {JSON.stringify(conflict.localValue, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Remote Value:</div>
                      <pre className="text-xs bg-white p-2 rounded border">
                        {JSON.stringify(conflict.remoteValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};