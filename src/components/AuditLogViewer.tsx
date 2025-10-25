import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, Filter, RefreshCw, User, Database, Activity, Calendar, Trash2 } from 'lucide-react';
import { useAuditLogs, AuditLogFilters } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const ACTION_COLORS = {
  'CREATE': 'bg-green-500',
  'UPDATE': 'bg-yellow-500', 
  'DELETE': 'bg-red-500',
  'LOGIN': 'bg-blue-500',
  'ROLE_CHANGE': 'bg-purple-500'
};

const TABLE_NAMES = [
  'opportunities', 'pipeline_items', 'user_profiles', 'sales_targets', 
  'entities', 'system_settings', 'organizations', 'contacts'
];

export const AuditLogViewer = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { auditLogs, loading, getActivitySummary, getTableActivity, getUserActivity, refetch, currentPage, totalPages, goToNextPage, goToPreviousPage, clearAuditLogs } = useAuditLogs(filters, 5);

  const handleApplyFilters = () => {
    const newFilters: AuditLogFilters = { ...filters };
    
    if (dateFrom && dateTo) {
      newFilters.dateRange = { from: dateFrom, to: dateTo };
    }
    
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setDateFrom('');
    setDateTo('');
  };

  const handleClearLogs = async () => {
    const ok = window.confirm('Hapus SEMUA audit logs? Tindakan ini permanen dan tidak bisa dibatalkan.');
    if (!ok) return;
    try {
      await clearAuditLogs('all');
      toast.success('Semua audit logs berhasil dihapus secara permanen.');
    } catch (err: any) {
      console.error('Failed to clear audit logs', err);
      toast.error(err?.message || 'Gagal menghapus audit logs.');
    }
  };

  const activitySummary = getActivitySummary();
  const tableActivity = getTableActivity();
  const userActivity = getUserActivity();

  const formatJsonPreview = (data: any) => {
    if (!data) return 'No data';
    
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      const keys = Object.keys(obj);
      
      if (keys.length <= 3) {
        return JSON.stringify(obj, null, 2);
      } else {
        const preview: Record<string, any> = {};
        keys.slice(0, 3).forEach(key => {
          preview[key] = obj[key];
        });
        return `${JSON.stringify(preview, null, 2)}\n... +${keys.length - 3} more fields`;
      }
    } catch {
      return String(data).substring(0, 100) + (String(data).length > 100 ? '...' : '');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Logs
        </CardTitle>
        <CardDescription>
          Comprehensive audit trail of all system activities and changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={filters.actionType || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, actionType: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="ROLE_CHANGE">Role Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Select
                  value={filters.tableName || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, tableName: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {TABLE_NAMES.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From date"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To date"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply
                </Button>
                <Button onClick={handleClearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
                <Button onClick={refetch} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={handleClearLogs} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Logs
                </Button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`text-white ${ACTION_COLORS[log.action_type] || 'bg-gray-500'}`}
                          >
                            {log.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {log.user_name}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {log.entity_name}
                        </TableCell>
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[600px] sm:max-w-[600px]">
                              <SheetHeader>
                                <SheetTitle>Audit Log Details</SheetTitle>
                                <SheetDescription>
                                  {log.action_type} action on {log.table_name} by {log.user_name}
                                </SheetDescription>
                              </SheetHeader>
                              
                              <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Metadata</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div><strong>Action:</strong> {log.action_type}</div>
                                      <div><strong>Table:</strong> {log.table_name}</div>
                                      <div><strong>User:</strong> {log.user_name}</div>
                                      <div><strong>Entity:</strong> {log.entity_name}</div>
                                      <div><strong>Time:</strong> {format(new Date(log.created_at), 'PPpp')}</div>
                                      <div><strong>Record ID:</strong> {log.record_id || 'N/A'}</div>
                                    </div>
                                  </div>

                                  {log.old_values && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Previous Values</h4>
                                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                        {formatJsonPreview(log.old_values)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.new_values && (
                                    <div>
                                      <h4 className="font-semibold mb-2">New Values</h4>
                                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                        {formatJsonPreview(log.new_values)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Additional Metadata</h4>
                                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Showing {auditLogs.length} entries - Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={goToPreviousPage} 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button 
                  onClick={goToNextPage} 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activitySummary.totalActions}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Creates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activitySummary.creates}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{activitySummary.updates}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Deletes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{activitySummary.deletes}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <div className="space-y-2">
              {tableActivity.map(({ table, count }) => (
                <div key={table} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{table}</span>
                  </div>
                  <Badge variant="secondary">{count} actions</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-2">
              {userActivity.map(({ userId, name, count }) => (
                <div key={userId} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{name}</span>
                  </div>
                  <Badge variant="secondary">{count} actions</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};