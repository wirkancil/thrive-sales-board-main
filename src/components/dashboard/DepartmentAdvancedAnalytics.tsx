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
    // TODO: Replace with real division performance data from opportunities and sales_activity_v2
    // For now using placeholder data structure that matches real division names
    const mockDivisionPerformance: DivisionPerformanceData[] = [
      { division: "Level Head North", deals: 84, value: 1250000, conversion: 28.5, growth: 15.2 },
      { division: "Level Head South", deals: 90, value: 1380000, conversion: 31.2, growth: 8.7 },
      { division: "Level Head East", deals: 64, value: 980000, conversion: 25.8, growth: 12.3 },
      { division: "Level Head West", deals: 81, value: 1180000, conversion: 29.1, growth: 18.9 },
      { division: "Level Head International", deals: 45, value: 650000, conversion: 22.4, growth: 25.6 }
    ];

    const mockActivityHeatmap: ActivityHeatmapData[] = [
      // Generate mock heatmap data for a week
      { day: "Mon", time: "9AM", activities: 12 },
      { day: "Mon", time: "10AM", activities: 18 },
      { day: "Mon", time: "11AM", activities: 24 },
      { day: "Mon", time: "2PM", activities: 15 },
      { day: "Mon", time: "3PM", activities: 22 },
      { day: "Tue", time: "9AM", activities: 16 },
      { day: "Tue", time: "10AM", activities: 28 },
      { day: "Tue", time: "11AM", activities: 20 },
      { day: "Tue", time: "2PM", activities: 19 },
      { day: "Tue", time: "3PM", activities: 25 },
      { day: "Wed", time: "9AM", activities: 14 },
      { day: "Wed", time: "10AM", activities: 22 },
      { day: "Wed", time: "11AM", activities: 18 },
      { day: "Wed", time: "2PM", activities: 21 },
      { day: "Wed", time: "3PM", activities: 17 },
      { day: "Thu", time: "9AM", activities: 20 },
      { day: "Thu", time: "10AM", activities: 26 },
      { day: "Thu", time: "11AM", activities: 23 },
      { day: "Thu", time: "2PM", activities: 18 },
      { day: "Thu", time: "3PM", activities: 24 },
      { day: "Fri", time: "9AM", activities: 15 },
      { day: "Fri", time: "10AM", activities: 19 },
      { day: "Fri", time: "11AM", activities: 16 },
      { day: "Fri", time: "2PM", activities: 13 },
      { day: "Fri", time: "3PM", activities: 11 }
    ];

    const mockMonthlyTrends: MonthlyTrendData[] = [
      { month: "Aug", deals: 285, value: 4200000, activities: 1250, conversion: 24.2 },
      { month: "Sep", deals: 312, value: 4650000, activities: 1380, conversion: 26.8 },
      { month: "Oct", deals: 298, value: 4420000, activities: 1290, conversion: 25.1 },
      { month: "Nov", deals: 334, value: 4980000, activities: 1450, conversion: 28.3 },
      { month: "Dec", deals: 364, value: 5440000, activities: 1520, conversion: 29.7 }
    ];

    setDivisionPerformance(mockDivisionPerformance);
    setActivityHeatmap(mockActivityHeatmap);
    setMonthlyTrends(mockMonthlyTrends);
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
          <React.Fragment key={day}>
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
          </React.Fragment>
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