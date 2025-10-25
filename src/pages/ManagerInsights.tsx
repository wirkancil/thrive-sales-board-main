import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, FunnelChart, Funnel, Cell } from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { ExportButton } from "@/components/ExportButton";
import { TrendingUp, Users, Clock, Target } from "lucide-react";
export default function ManagerInsights() {
  const {
    profile
  } = useProfile();
  const {
    opportunities,
    activities,
    loading
  } = useRoleBasedData();

  // Initialize empty data - in real app, fetch from API
  const funnelData: any[] = [];

  // Initialize empty velocity data
  const velocityData: any[] = [];

  // Initialize empty win-rate data
  const winRateData: any[] = [];

  // Calculate activity hygiene score
  const calculateActivityHygiene = () => {
    const totalOpportunities = opportunities.length;
    const opportunitiesWithRecentActivity = opportunities.filter(opp => {
      if (!opp.last_activity_at) return false;
      const daysSinceActivity = Math.ceil((new Date().getTime() - new Date(opp.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity <= 7;
    }).length;
    return totalOpportunities > 0 ? Math.round(opportunitiesWithRecentActivity / totalOpportunities * 100) : 0;
  };
  const activityHygiene = calculateActivityHygiene();
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  return <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Insights</h1>
          <p className="text-muted-foreground mt-1">
            Manager / Pipeline / Insights
          </p>
        </div>
        <ExportButton 
          data={opportunities} 
          filename="pipeline-insights"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip formatter={(value, name) => [`${value} opportunities`, name]} labelFormatter={() => ''} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {funnelData.map((stage, index) => <div key={stage.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: stage.fill
                }} />
                    <span>{stage.name}</span>
                  </div>
                  <span className="font-medium">{stage.value}</span>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Velocity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Velocity (Avg Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{
                fontSize: 12
              }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value, name) => [`${value} days`, name === 'avgDays' ? 'Current Period' : 'Previous Period']} />
                <Line type="monotone" dataKey="avgDays" stroke="#8884d8" strokeWidth={3} dot={{
                fill: '#8884d8',
                strokeWidth: 2,
                r: 4
              }} />
                <Line type="monotone" dataKey="previousPeriod" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={{
                fill: '#82ca9d',
                strokeWidth: 2,
                r: 3
              }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win-rate by Rep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Win-rate by Rep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={winRateData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="rep" type="category" tick={{
                fontSize: 12
              }} width={100} />
                <Tooltip formatter={(value, name) => [name === 'winRate' ? `${value}%` : `${value} deals`, name === 'winRate' ? 'Win Rate' : 'Total Deals']} />
                <Bar dataKey="winRate" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">No Data Available</div>
                <div className="text-muted-foreground">Connect to API for data</div>
              </div>
              <div>
                <div className="font-medium">No Data Available</div>
                <div className="text-muted-foreground">Connect to API for data</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Hygiene */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Activity Hygiene
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-6xl font-bold text-orange-500 mb-2">
                  {activityHygiene}%
                </div>
                <div className="text-lg text-muted-foreground mb-4">
                  Opportunities with Recent Activity
                </div>
                <div className="text-sm text-muted-foreground">
                  {opportunities.filter(opp => {
                  if (!opp.last_activity_at) return false;
                  const daysSinceActivity = Math.ceil((new Date().getTime() - new Date(opp.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
                  return daysSinceActivity <= 7;
                }).length} of {opportunities.length} opportunities have activity within 7 days
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Excellent (90%+)</span>
                <div className="w-16 h-2 bg-green-200 rounded">
                  <div className="h-full bg-green-500 rounded" style={{
                  width: activityHygiene >= 90 ? '100%' : '0%'
                }} />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Good (70-89%)</span>
                <div className="w-16 h-2 bg-yellow-200 rounded">
                  <div className="h-full bg-yellow-500 rounded" style={{
                  width: activityHygiene >= 70 && activityHygiene < 90 ? '100%' : '0%'
                }} />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Needs Attention (&lt;70%)</span>
                <div className="w-16 h-2 bg-red-200 rounded">
                  <div className="h-full bg-red-500 rounded" style={{
                  width: activityHygiene < 70 ? '100%' : '0%'
                }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
  // Initialize empty data - in real app, fetch from API