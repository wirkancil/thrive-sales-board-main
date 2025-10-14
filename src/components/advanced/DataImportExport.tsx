import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  FileText as FileCsv
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportJob {
  id: string;
  name: string;
  type: 'contacts' | 'opportunities' | 'activities' | 'organizations';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_records: number;
  processed_records: number;
  error_records: number;
  created_at: string;
  file_name: string;
  file_size: number;
}

interface ExportJob {
  id: string;
  name: string;
  type: 'contacts' | 'opportunities' | 'activities' | 'organizations' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'csv' | 'xlsx' | 'json';
  filters: any;
  download_url?: string;
  created_at: string;
  expires_at: string;
}

export const DataImportExport = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: '1',
      name: 'Q4 Leads Import',
      type: 'contacts',
      status: 'completed',
      progress: 100,
      total_records: 1250,
      processed_records: 1250,
      error_records: 0,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      file_name: 'q4_leads.csv',
      file_size: 2.4 * 1024 * 1024
    },
    {
      id: '2',
      name: 'Legacy CRM Migration',
      type: 'opportunities',
      status: 'processing',
      progress: 65,
      total_records: 3200,
      processed_records: 2080,
      error_records: 15,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      file_name: 'legacy_opportunities.xlsx',
      file_size: 8.7 * 1024 * 1024
    }
  ]);

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Monthly Sales Report',
      type: 'opportunities',
      status: 'completed',
      format: 'xlsx',
      filters: { date_range: 'last_30_days', stage: 'all' },
      download_url: '/api/exports/monthly-sales.xlsx',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('contacts');
  const [exportType, setExportType] = useState<string>('contacts');
  const [exportFormat, setExportFormat] = useState<string>('csv');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    const newJob: ImportJob = {
      id: Date.now().toString(),
      name: selectedFile.name.replace(/\.[^/.]+$/, ''),
      type: importType as any,
      status: 'processing',
      progress: 0,
      total_records: 0,
      processed_records: 0,
      error_records: 0,
      created_at: new Date().toISOString(),
      file_name: selectedFile.name,
      file_size: selectedFile.size
    };

    setImportJobs(prev => [newJob, ...prev]);
    toast.success('Import job started');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 20, 100);
          const isComplete = newProgress >= 100;
          return {
            ...job,
            progress: newProgress,
            status: isComplete ? 'completed' : 'processing',
            total_records: isComplete ? 1500 : job.total_records,
            processed_records: isComplete ? 1500 : Math.floor(1500 * (newProgress / 100))
          };
        }
        return job;
      }));
    }, 1000);

    setTimeout(() => clearInterval(progressInterval), 8000);
  };

  const handleExport = async () => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `${exportType} Export ${new Date().toLocaleDateString()}`,
      type: exportType as any,
      status: 'processing',
      format: exportFormat as any,
      filters: {},
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    setExportJobs(prev => [newJob, ...prev]);
    toast.success('Export job started');

    // Simulate completion
    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'completed', download_url: `/api/exports/${newJob.id}.${exportFormat}` }
          : job
      ));
      toast.success('Export completed');
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contacts':
        return <Database className="h-4 w-4" />;
      case 'opportunities':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileCsv className="h-4 w-4" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Data Import & Export
        </h2>
        <p className="text-muted-foreground">Manage bulk data operations and migrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="import-type">Data Type</Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="opportunities">Opportunities</SelectItem>
                      <SelectItem value="activities">Activities</SelectItem>
                      <SelectItem value="organizations">Organizations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-file">File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv,.xlsx,.json"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">{formatFileSize(selectedFile.size)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ready to import {importType} data
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!selectedFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Import Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(job.type)}
                        <span className="font-medium">{job.name}</span>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm capitalize">{job.status}</span>
                      </div>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <Progress value={job.progress} className="w-full" />
                        <p className="text-sm text-muted-foreground">
                          {job.processed_records.toLocaleString()} of {job.total_records.toLocaleString()} records processed
                          {job.error_records > 0 && (
                            <span className="text-red-500 ml-2">
                              ({job.error_records} errors)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <p className="text-sm text-muted-foreground">
                        Successfully imported {job.processed_records.toLocaleString()} records
                        {job.error_records > 0 && (
                          <span className="text-red-500 ml-2">
                            ({job.error_records} errors)
                          </span>
                        )}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>{job.file_name} • {formatFileSize(job.file_size)}</span>
                      <span>{new Date(job.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="export-type">Data Type</Label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="opportunities">Opportunities</SelectItem>
                      <SelectItem value="activities">Activities</SelectItem>
                      <SelectItem value="organizations">Organizations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-format">Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={handleExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Start Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Export Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(job.type)}
                        <span className="font-medium">{job.name}</span>
                        <Badge variant="outline">{job.type}</Badge>
                        <div className="flex items-center gap-1">
                          {getFormatIcon(job.format)}
                          <span className="text-xs uppercase">{job.format}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm capitalize">{job.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-muted-foreground">
                        <span>Created: {new Date(job.created_at).toLocaleString()}</span>
                        {job.status === 'completed' && (
                          <span className="ml-4">
                            Expires: {new Date(job.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {job.status === 'completed' && job.download_url && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t">
                  <div className="text-lg font-semibold">24,567</div>
                  <div className="text-sm text-muted-foreground">Total Records Imported</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold">8</div>
                    <div className="text-xs text-muted-foreground">CSV</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">5</div>
                    <div className="text-xs text-muted-foreground">XLSX</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">3</div>
                    <div className="text-xs text-muted-foreground">JSON</div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t">
                  <div className="text-lg font-semibold">16</div>
                  <div className="text-sm text-muted-foreground">Total Exports</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};