import { useState } from "react";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSalesSummary } from "@/hooks/useSalesSummary";
import { formatCurrency } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, DollarSign, Target, Award } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

export default function HeadSalesSummary() {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { data: metrics, isLoading } = useSalesSummary(dateRange.start, dateRange.end);

  const exportCSV = () => {
    if (!metrics) return;

    const csvData = [
      ['Organization Sales Summary Report'],
      [''],
      ['Executive Metrics', 'Value'],
      ['Total Revenue', formatCurrency(metrics.totalRevenue, 'USD')],
      ['Deals Closed', metrics.dealsClosed.toString()],
      ['Target Achievement', `${metrics.targetAchievement.toFixed(1)}%`],
      ['Average Deal Size', formatCurrency(metrics.averageDealSize, 'USD')],
      ['Conversion Rate', `${metrics.conversionRate.toFixed(1)}%`],
      [''],
      ['Top Performers'],
      ['Name', 'Revenue', 'Deals Closed'],
      ...metrics.topPerformers.map(p => [p.name, formatCurrency(p.revenue, 'USD'), p.deals.toString()]),
      [''],
      ['Revenue by Month'],
      ['Month', 'Revenue', 'Deals'],
      ...metrics.revenueByMonth.map(m => [m.month, formatCurrency(m.revenue, 'USD'), m.deals.toString()]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `org-sales-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const exportPDF = () => {
    toast.info('PDF export coming soon');
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Sales Summary</h1>
            <p className="text-muted-foreground">Executive overview of sales performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(metrics?.totalRevenue || 0, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals Closed</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.dealsClosed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics?.targetAchievement.toFixed(1)}%
              </div>
              <div className={`text-xs ${(metrics?.targetAchievement || 0) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {(metrics?.targetAchievement || 0) >= 100 ? 'Target exceeded' : 'Below target'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(metrics?.averageDealSize || 0, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics?.conversionRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                  <Line type="monotone" dataKey="deals" stroke="#82ca9d" name="Deals" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pipeline Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={metrics?.pipelineByStage || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.stage}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.pipelineByStage.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics?.topPerformers || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                <Bar dataKey="deals" fill="#82ca9d" name="Deals Closed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
