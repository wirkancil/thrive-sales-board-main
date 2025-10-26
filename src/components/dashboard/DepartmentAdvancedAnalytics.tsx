import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { BarChart3, TrendingUp, Activity, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DepartmentAdvancedAnalyticsProps {
  selectedDivision: string;
  selectedRep: string;
  dateRange: string;
}

interface DivisionPerformanceData {
  division: string;
  deals: number;
  value: number;
  conversion: number;
  growth: number;
}

interface ActivityHeatmapData {
  day: string;
  time: string;
  activities: number;
}

interface MonthlyTrendData {
  month: string;
  deals: number;
  value: number;
  activities: number;
  conversion: number;
}

export function DepartmentAdvancedAnalytics({ selectedDivision, selectedRep, dateRange }: DepartmentAdvancedAnalyticsProps) {
  const navigate = useNavigate();
  const [divisionPerformance, setDivisionPerformance] = useState<DivisionPerformanceData[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<ActivityHeatmapData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendData[]>([]);

  useEffect(() => {
    // Initialize with empty data arrays - real data would come from API
    setDivisionPerformance([]);
    setActivityHeatmap([]);
    setMonthlyTrends([]);
  }, [selectedDivision, selectedRep, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'value' ? formatCurrency(entry.value) : 
                           entry.dataKey === 'conversion' ? `${entry.value}%` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Create heatmap visualization data
  const createHeatmapVisualization = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const times = ['9AM', '10AM', '11AM', '2PM', '3PM'];
    
    return (
      <div className="grid grid-cols-6 gap-1 text-xs">
        <div></div>
        {times.map(time => (
          <div key={time} className="text-center font-medium text-muted-foreground p-1">
            {time}
          </div>
        ))}
        {days.map(day => (
          <div className="contents" key={day}>
            <div className="font-medium text-muted-foreground p-1">{day}</div>
            {times.map(time => {
              const data = activityHeatmap.find(d => d.day === day && d.time === time);
              const intensity = data ? Math.min(data.activities / 30, 1) : 0;
              const backgroundColor = `rgba(59, 130, 246, ${intensity})`;
              return (
                <div
                  key={`${day}-${time}`}
                  className="aspect-square rounded border border-border flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor }}
                  title={`${day} ${time}: ${data?.activities || 0} activities`}
                >
                  {data?.activities || 0}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Advanced Analytics</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/analytics')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Full Analytics Suite
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Deal Performance by Division */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Deal Performance by Division
            </CardTitle>
            <CardDescription>
              Deals, value, and conversion rates across divisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="division" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    yAxisId="left"
                    dataKey="deals" 
                    fill="hsl(var(--primary))" 
                    name="Deals"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="conversion" 
                    fill="#10b981" 
                    name="Conversion %"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Activity Heatmap
            </CardTitle>
            <CardDescription>
              Sales activity intensity by day and time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {createHeatmapVisualization()}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Low Activity</span>
              <div className="flex items-center gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="w-3 h-3 rounded border border-border"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                  />
                ))}
              </div>
              <span>High Activity</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Trends
          </CardTitle>
          <CardDescription>
            Department-wide performance trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="activitiesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="deals"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dealsGradient)"
                  name="Deals"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="activities"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activitiesGradient)"
                  name="Activities"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversion"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
                  name="Conversion %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trend Insights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">
                {monthlyTrends[monthlyTrends.length - 1]?.deals || 0}
              </p>
              <p className="text-xs text-muted-foreground">Current Month Deals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(monthlyTrends[monthlyTrends.length - 1]?.value || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Current Month Value</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {monthlyTrends[monthlyTrends.length - 1]?.activities || 0}
              </p>
              <p className="text-xs text-muted-foreground">Current Activities</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-yellow-600">
                {monthlyTrends[monthlyTrends.length - 1]?.conversion || 0}%
              </p>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}