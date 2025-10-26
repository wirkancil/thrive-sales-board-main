import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { RoleBadge } from "@/components/RoleBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3, 
  PieChart,
  Activity,
  Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";

interface PipelineMetrics {
  totalValue: number;
  totalOpportunities: number;
  avgDealSize: number;
  avgCycleTime: number;
  conversionRate: number;
  activitiesCount: number;
}

interface StageMetrics {
  id: string;
  name: string;
  count: number;
  value: number;
  conversionRate: number;
  avgTimeInStage: number;
}

interface UserPerformance {
  id: string;
  name: string;
  role: string;
  opportunityCount: number;
  totalValue: number;
  avgDealSize: number;
  activitiesCount: number;
}

export default function PipelineAnalytics() {
  const { profile: userProfile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    totalValue: 0,
    totalOpportunities: 0,
    avgDealSize: 0,
    avgCycleTime: 0,
    conversionRate: 0,
    activitiesCount: 0
  });
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);

  // Fetch analytics data
  useEffect(() => {
    if (!userProfile) return;
    
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const daysBack = parseInt(timeRange.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        // Get overall metrics
        let opportunitiesQuery = supabase
          .from('opportunities')
          .select('*')
          .gte('created_at', startDate.toISOString());

        // Apply role-based filtering
        if (userProfile.role === 'account_manager') {
          opportunitiesQuery = opportunitiesQuery.eq('owner_id', userProfile.id);
        }

        const { data: opportunities, error: oppError } = await opportunitiesQuery;
        
        if (oppError) throw oppError;

        // Calculate metrics
        const totalValue = opportunities?.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;
        const totalOpportunities = opportunities?.length || 0;
        const wonOpportunities = opportunities?.filter(opp => opp.status === 'won').length || 0;
        const avgDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0;
        const conversionRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

        // Get activities count
        let activitiesQuery = supabase
          .from('activities')
          .select('id')
          .gte('created_at', startDate.toISOString());

        const { data: activities, error: actError } = await activitiesQuery;
        if (actError) throw actError;

        // Get stage metrics
        const { data: stages, error: stagesError } = await supabase
          .from('pipeline_stages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (stagesError) throw stagesError;

        const stageMetricsData: StageMetrics[] = stages?.map(stage => {
          const stageOpportunities = opportunities?.filter(opp => opp.stage_id === stage.id) || [];
          const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
          
          return {
            id: stage.id,
            name: stage.name,
            count: stageOpportunities.length,
            value: stageValue,
            conversionRate: stage.default_probability * 100,
            avgTimeInStage: 0 // Would calculate from stage history
          };
        }) || [];

        // Get user performance (for managers and above)
        let userPerformanceData: UserPerformance[] = [];
        if (userProfile.role !== 'account_manager') {
          const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('id, full_name, role')
            .eq('is_active', true);

          if (!usersError && users) {
            userPerformanceData = users.map(user => {
              const userOpportunities = opportunities?.filter(opp => opp.owner_id === user.id) || [];
              const userValue = userOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
              
              return {
                id: user.id,
                name: user.full_name || 'Unknown',
                role: user.role,
                opportunityCount: userOpportunities.length,
                totalValue: userValue,
                avgDealSize: userOpportunities.length > 0 ? userValue / userOpportunities.length : 0,
                activitiesCount: 0 // Would need to join activities table
              };
            }).filter(user => user.opportunityCount > 0);
          }
        }

        setMetrics({
          totalValue,
          totalOpportunities,
          avgDealSize,
          avgCycleTime: 0, // Would calculate from opportunity history
          conversionRate,
          activitiesCount: activities?.length || 0
        });
        setStageMetrics(stageMetricsData);
        setUserPerformance(userPerformanceData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userProfile, timeRange]);

  if (loading || profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load user profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Pipeline Analytics</h1>
          <RoleBadge role={userProfile.role} />
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalOpportunities} opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              Per opportunity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Win percentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activitiesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Stage Analysis</TabsTrigger>
          {userProfile.role !== 'account_manager' && (
            <TabsTrigger value="performance">Team Performance</TabsTrigger>
          )}
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Pipeline Stage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stageMetrics.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{stage.name}</Badge>
                      <div>
                        <p className="font-medium">{stage.count} opportunities</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(stage.value)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stage.conversionRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">conversion rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userProfile.role !== 'account_manager' && (
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPerformance.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <p className="font-medium">{user.opportunityCount}</p>
                          <p className="text-sm text-muted-foreground">opportunities</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(user.totalValue)}</p>
                          <p className="text-sm text-muted-foreground">total value</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(user.avgDealSize)}</p>
                          <p className="text-sm text-muted-foreground">avg deal</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Revenue Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Best Case</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(metrics.totalValue * 0.8)}
                    </p>
                    <p className="text-xs text-muted-foreground">80% of pipeline</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Most Likely</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(metrics.totalValue * 0.5)}
                    </p>
                    <p className="text-xs text-muted-foreground">50% of pipeline</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Conservative</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(metrics.totalValue * 0.3)}
                    </p>
                    <p className="text-xs text-muted-foreground">30% of pipeline</p>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Forecasts based on current pipeline and historical conversion rates
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}