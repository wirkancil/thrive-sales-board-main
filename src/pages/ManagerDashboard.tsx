import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { RoleBasedFilters } from "@/components/RoleBasedFilters";
import { formatCurrency } from "@/lib/constants";
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { TrendingUp, Target, Users, AlertCircle, Calendar, Activity, Clock, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function ManagerDashboard() {
  const { profile } = useProfile();
  const { formatCurrency: formatCurrencyWithLocale } = useCurrencyFormatter();
  const { 
    opportunities, 
    activities, 
    availableReps, 
    availableManagers,
    metrics,
    loading,
    refreshData
  } = useRoleBasedData();
  
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData({ selectedRep, selectedManager });
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRepChange = (repId: string) => {
    setSelectedRep(repId);
    refreshData({ selectedRep: repId, selectedManager });
  };

  const handleManagerChange = (managerId: string) => {
    setSelectedManager(managerId);
    refreshData({ selectedRep, selectedManager: managerId });
  };

  // Calculate pipeline health metrics
  const calculatePipelineHealth = () => {
    const totalOpportunities = opportunities.length;
    const staleOpportunities = opportunities.filter(opp => {
      if (!opp.last_activity_at) return true;
      const daysSinceActivity = Math.ceil((new Date().getTime() - new Date(opp.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity > 14;
    }).length;
    
    const healthScore = totalOpportunities > 0 ? Math.round((totalOpportunities - staleOpportunities) / totalOpportunities * 100) : 100;
    
    return {
      healthScore,
      staleOpportunities,
      activeOpportunities: totalOpportunities - staleOpportunities
    };
  };

  // Sales performance data for charts
  const salesPerformanceData = useMemo(() => {
    const monthsBack = 6;
    const now = new Date();
    const monthKeys: { key: string; label: string; start: Date; end: Date }[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthKeys.push({ key, label, start, end });
    }

    const data = monthKeys.map(({ label, start, end }) => {
      const inRange = (dt?: string | Date | null) => {
        if (!dt) return false;
        const time = new Date(dt).getTime();
        return time >= start.getTime() && time <= end.getTime();
      };

      const monthOpps = opportunities.filter(o => inRange(o.created_at));
      const monthDeals = opportunities.filter(o => {
        const isWon = (o.stage === 'Closed Won');
        const closedOrUpdated = o.updated_at ?? o.created_at;
        return isWon && inRange(closedOrUpdated);
      });

      const revenue = monthDeals.reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        month: label,
        opportunities: monthOpps.length,
        deals: monthDeals.length,
        revenue,
      };
    });

    return data;
  }, [opportunities]);

  // Stage distribution data
  const stageDistribution = [
    { name: 'Prospecting', value: opportunities.filter(o => o.stage === 'Prospecting').length, color: '#8884d8' },
    { name: 'Qualification', value: opportunities.filter(o => o.stage === 'Qualification').length, color: '#82ca9d' },
    { name: 'Proposal', value: opportunities.filter(o => o.stage === 'Negotiation').length, color: '#ffc658' },
    { name: 'Closed Won', value: opportunities.filter(o => o.stage === 'Closed Won').length, color: '#ff7300' },
  ];

  const { healthScore, staleOpportunities, activeOpportunities } = calculatePipelineHealth();

  if (loading) {
    return <div className="p-6">Loading Manager Dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive overview of your team's performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <RoleBasedFilters
        userRole={profile?.role || 'manager'}
        availableReps={availableReps}
        availableManagers={availableManagers}
        selectedRep={selectedRep}
        selectedManager={selectedManager}
        onRepChange={handleRepChange}
        onManagerChange={handleManagerChange}
        onRefresh={handleRefresh}
        loading={refreshing}
      />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyWithLocale(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalDeals} active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.wonDeals} deals won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <p className="text-xs text-muted-foreground">
              {staleOpportunities} stale opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Sales Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrencyWithLocale(value as number), 'Revenue'];
                  return [value, name];
                }} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} name="revenue" />
                <Line type="monotone" dataKey="deals" stroke="#82ca9d" strokeWidth={2} name="deals" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stageDistribution.map((stage, index) => (
                <div key={stage.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <span>{stage.name}: {stage.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Recent Team Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.activity_type}</div>
                    <div className="text-sm text-muted-foreground">{activity.customer_name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {metrics.recentActivities.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No recent activities
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Top Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))
                .slice(0, 5)
                .map((opp) => (
                  <div key={opp.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opp.name}</div>
                      <div className="text-sm text-muted-foreground">{opp.stage}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrencyWithLocale(opp.amount || 0)}</div>
                      <div className="text-xs text-muted-foreground">{opp.probability}%</div>
                    </div>
                  </div>
                ))}
              {opportunities.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No opportunities available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}