import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { format, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface Deal {
  id: string;
  stage: string;
  status: string;
  deal_value: number;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  date: string;
  created_at: string;
  customer_name: string;
  time: string;
  notes: string;
}

const DEAL_STAGES = ["Lead", "Prospect", "Proposal", "Negotiation", "Closed"];
const DEAL_STATUSES = ["Warm", "Hot", "Cold", "Won", "Lost"];

const STATUS_COLORS = {
  Warm: "#3b82f6",
  Hot: "#ef4444", 
  Cold: "#6b7280",
  Won: "#10b981",
  Lost: "#f59e0b",
};

export function SalesAnalyticsDashboard() {
  const { formatCurrency } = useCurrencyFormatter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subWeeks(new Date(), 8),
    end: new Date(),
  });
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.end, 'yyyy-MM-dd'));

      if (dealsError) throw dealsError;

      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('sales_activity_v2')
        .select('*')
        .eq('created_by', user.id)
        .gte('scheduled_at', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('scheduled_at', format(dateRange.end, 'yyyy-MM-dd'));

      // Fallback if v2 relation is missing
      if (activitiesError && (activitiesError.code === '42P01' || (activitiesError.message || '').includes('sales_activity_v2'))) {
        const { data: legacyActivities, error: legacyError } = await supabase
          .from('sales_activity')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('created_at', format(dateRange.end, 'yyyy-MM-dd'));
        if (legacyError) throw legacyError;

        setDeals(dealsData || []);
        setActivities(
          (legacyActivities || []).map((activity: any) => ({
            id: activity.id,
            customer_name: activity.customer_name || '-',
            activity_type:
              activity.activity_type?.toLowerCase() === 'meeting'
                ? 'Meeting'
                : activity.activity_type?.toLowerCase() === 'email'
                  ? 'Email'
                  : 'Call',
            date: new Date(activity.activity_time || activity.created_at).toLocaleDateString(),
            time: new Date(activity.activity_time || activity.created_at).toLocaleTimeString(),
            notes: activity.notes || 'No notes',
            created_at: activity.created_at || activity.activity_time,
          }))
        );
      } else {
        if (activitiesError) throw activitiesError;

        setDeals(dealsData || []);
        setActivities(
          activitiesData?.map((activity: any) => ({
            id: activity.id,
            customer_name: activity.customer_name || '-',
            activity_type:
              activity.activity_type?.toLowerCase() === 'meeting'
                ? 'Meeting'
                : activity.activity_type?.toLowerCase() === 'email'
                  ? 'Email'
                  : 'Call',
            date: new Date(activity.scheduled_at || activity.created_at).toLocaleDateString(),
            time: new Date(activity.scheduled_at || activity.created_at).toLocaleTimeString(),
            notes: activity.notes || 'No notes',
            created_at: activity.created_at || activity.scheduled_at,
          })) || []
        );
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, dateRange]);

  // Process deals per stage
  const dealsPerStage = DEAL_STAGES.map(stage => ({
    stage,
    count: deals.filter(deal => deal.stage === stage).length,
    value: deals.filter(deal => deal.stage === stage).reduce((sum, deal) => sum + Number(deal.deal_value), 0),
  }));

  // Process activities per week
  const activitiesPerWeek = eachWeekOfInterval({ start: dateRange.start, end: dateRange.end })
    .map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const weekActivities = activities.filter(activity => {
        const activityDate = parseISO(activity.date);
        return activityDate >= weekStart && activityDate <= weekEnd;
      });

      return {
        week: format(weekStart, 'MMM dd'),
        activities: weekActivities.length,
        calls: weekActivities.filter(a => a.activity_type === 'Call').length,
        meetings: weekActivities.filter(a => a.activity_type === 'Meeting').length,
        emails: weekActivities.filter(a => a.activity_type === 'Email').length,
      };
    });

  // Process deal status distribution
  const dealStatusDistribution = DEAL_STATUSES.map(status => ({
    name: status,
    value: deals.filter(deal => deal.status === status).length,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  })).filter(item => item.value > 0);

  // Calculate summary metrics
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + Number(deal.deal_value), 0);
  const wonDeals = deals.filter(deal => deal.status === 'Won').length;
  const winRate = totalDeals > 0 ? (wonDeals / totalDeals * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.start, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.end, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Sales Rep</label>
              <Select value={selectedRep} onValueChange={setSelectedRep}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  <SelectItem value="current">Current User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue, 'USD')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{winRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activities</p>
                <p className="text-2xl font-bold text-foreground">{activities.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals per Stage Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Deals per Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dealsPerStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dealStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dealStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activities per Week Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activities per Week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={activitiesPerWeek}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="activities" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Activities"
              />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Calls"
              />
              <Line 
                type="monotone" 
                dataKey="meetings" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Meetings"
              />
              <Line 
                type="monotone" 
                dataKey="emails" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Emails"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}