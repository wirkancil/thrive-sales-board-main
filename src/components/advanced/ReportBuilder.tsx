import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Eye, 
  Save, 
  Plus, 
  Trash2, 
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  category: string;
}

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface ReportConfig {
  name: string;
  description: string;
  fields: string[];
  filters: FilterCondition[];
  groupBy: string;
  sortBy: string;
  chartType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const ReportBuilder: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    groupBy: '',
    sortBy: '',
    chartType: 'table',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [savedReports, setSavedReports] = useState([
    { id: '1', name: 'Monthly Sales Report', lastRun: '2024-01-15', type: 'Sales' },
    { id: '2', name: 'Pipeline Analysis', lastRun: '2024-01-14', type: 'Pipeline' },
    { id: '3', name: 'Team Performance', lastRun: '2024-01-13', type: 'Performance' }
  ]);

  const availableFields: ReportField[] = [
    { id: 'opportunity_name', name: 'Opportunity Name', type: 'text', category: 'Opportunities' },
    { id: 'opportunity_value', name: 'Opportunity Value', type: 'number', category: 'Opportunities' },
    { id: 'opportunity_stage', name: 'Opportunity Stage', type: 'text', category: 'Opportunities' },
    { id: 'close_date', name: 'Expected Close Date', type: 'date', category: 'Opportunities' },
    { id: 'owner_name', name: 'Owner Name', type: 'text', category: 'Users' },
    { id: 'customer_name', name: 'Customer Name', type: 'text', category: 'Customers' },
    { id: 'activity_count', name: 'Activity Count', type: 'number', category: 'Activities' },
    { id: 'created_date', name: 'Created Date', type: 'date', category: 'General' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ];

  const chartTypes = [
    { value: 'table', label: 'Table', icon: FileText },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'line', label: 'Line Chart', icon: LineChart }
  ];

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldId]
        : prev.fields.filter(id => id !== fieldId)
    }));
  };

  const addFilter = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: '', value: '' }]
    }));
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const saveReport = () => {
    if (!reportConfig.name) {
      alert('Please enter a report name');
      return;
    }

    const newReport = {
      id: Date.now().toString(),
      name: reportConfig.name,
      lastRun: new Date().toISOString().split('T')[0],
      type: 'Custom'
    };

    setSavedReports(prev => [...prev, newReport]);
    console.log('Saving report:', reportConfig);
  };

  const generateReport = () => {
    console.log('Generating report with config:', reportConfig);
    // Mock report generation
  };

  const exportReport = (format: 'csv' | 'pdf' | 'xlsx') => {
    console.log(`Exporting report as ${format}`);
    // Mock export functionality
  };

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Report Builder</h2>
          <p className="text-muted-foreground">
            Create custom reports and analytics dashboards
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveReport}>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </Button>
          <Button onClick={generateReport}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>
                    Set up the basic parameters for your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input
                        id="report-name"
                        value={reportConfig.name}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter report name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select 
                        value={reportConfig.chartType} 
                        onValueChange={(value) => setReportConfig(prev => ({ ...prev, chartType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {chartTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={reportConfig.description}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the report"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={reportConfig.dateRange.start}
                        onChange={(e) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={reportConfig.dateRange.end}
                        onChange={(e) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Field Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Fields</CardTitle>
                  <CardDescription>
                    Select the fields to include in your report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(fieldsByCategory).map(([category, fields]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {fields.map((field) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={field.id}
                                checked={reportConfig.fields.includes(field.id)}
                                onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                              />
                              <Label htmlFor={field.id} className="text-sm">
                                {field.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Filters & Conditions</span>
                    <Button variant="outline" size="sm" onClick={addFilter}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Filter
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Define conditions to filter your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportConfig.filters.map((filter, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                        <div className="space-y-2">
                          <Label>Field</Label>
                          <Select
                            value={filter.field}
                            onValueChange={(value) => updateFilter(index, { field: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Operator</Label>
                          <Select
                            value={filter.operator}
                            onValueChange={(value) => updateFilter(index, { operator: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Enter value"
                          />
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeFilter(index)}
                          className="h-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {reportConfig.filters.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No filters applied. Click "Add Filter" to add conditions.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>
                    Live preview of your report configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Selected Fields ({reportConfig.fields.length})</h4>
                    <div className="space-y-1">
                      {reportConfig.fields.map(fieldId => {
                        const field = availableFields.find(f => f.id === fieldId);
                        return field ? (
                          <Badge key={fieldId} variant="secondary" className="text-xs">
                            {field.name}
                          </Badge>
                        ) : null;
                      })}
                      {reportConfig.fields.length === 0 && (
                        <p className="text-muted-foreground text-sm">No fields selected</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Active Filters ({reportConfig.filters.length})</h4>
                    <div className="space-y-1">
                      {reportConfig.filters.map((filter, index) => {
                        const field = availableFields.find(f => f.id === filter.field);
                        return filter.field ? (
                          <div key={index} className="text-xs text-muted-foreground">
                            {field?.name} {filter.operator} {filter.value}
                          </div>
                        ) : null;
                      })}
                      {reportConfig.filters.length === 0 && (
                        <p className="text-muted-foreground text-sm">No filters applied</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button className="w-full" onClick={generateReport}>
                      <Eye className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
                        <Download className="w-3 h-3 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport('xlsx')}>
                        <Download className="w-3 h-3 mr-1" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <CardDescription>
                Manage and run your saved report templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last run: {report.lastRun} • Type: {report.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Run
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
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

export default ReportBuilder;