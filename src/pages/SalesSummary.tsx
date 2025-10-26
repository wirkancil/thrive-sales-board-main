import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AddProjectModal } from "@/components/modals/AddProjectModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  Target,
  Users,
  Phone,
  Video,
  Building,
  AlertTriangle,
  Clock,
  Plus,
  DollarSign,
  Calendar,
  Percent,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";


const SalesSummary = () => {
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dealsClosed, setDealsClosed] = useState({ won: 0, lost: 0 });
  const [pipelineValue, setPipelineValue] = useState({ total: 0, count: 0 });
  const [dealsByStage, setDealsByStage] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [customerInsights, setCustomerInsights] = useState({ newCustomers: 0 });
  const [activitySummary, setActivitySummary] = useState({
    calls: 0,
    meetings: 0,
    visits: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [achievement, setAchievement] = useState({
  revenue: { actual: 0, target: 0, percentage: 0 },
  margin: { actual: 0, target: 0, percentage: 0 },
});
  const dateRange = "Sep 1 - Sep 30, 2025";

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Determine scope owner ids (user_ids) for manager/head/admin
        let scopeOwnerIds: string[] = [user.id];
        let scopeProfileIds: string[] = [];

        // Get current user profile
        const { data: myProfile } = await supabase
          .from("user_profiles")
          .select("id, role, department_id, division_id, entity_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (myProfile?.role === "manager") {
          // Prefer team mapping
          const { data: teamMap } = await supabase
            .from("manager_team_members")
            .select("account_manager_id")
            .eq("manager_id", myProfile.id);
          const amProfileIds = (teamMap || []).map((t: any) => t.account_manager_id);
          if (amProfileIds.length > 0) {
            const { data: amUsers } = await supabase
              .from("user_profiles")
              .select("id, user_id")
              .in("id", amProfileIds);
            scopeOwnerIds = (amUsers || []).map((u: any) => u.user_id).filter(Boolean);
            scopeProfileIds = (amUsers || []).map((u: any) => u.id).filter(Boolean);
          } else if (myProfile.department_id) {
            const { data: deptUsers } = await supabase
              .from("user_profiles")
              .select("id, user_id")
              .eq("department_id", myProfile.department_id);
            scopeOwnerIds = (deptUsers || []).map((u: any) => u.user_id).filter(Boolean);
            scopeProfileIds = (deptUsers || []).map((u: any) => u.id).filter(Boolean);
          }
        } else if (myProfile?.role === "head") {
          if (myProfile.division_id) {
            const { data: divUsers } = await supabase
              .from("user_profiles")
              .select("id, user_id")
              .eq("division_id", myProfile.division_id);
            scopeOwnerIds = (divUsers || []).map((u: any) => u.user_id).filter(Boolean);
            scopeProfileIds = (divUsers || []).map((u: any) => u.id).filter(Boolean);
          }
        } else if (myProfile?.role === "admin") {
          const { data: allUsers } = await supabase
            .from("user_profiles")
            .select("id, user_id")
            .eq("is_active", true);
          scopeOwnerIds = (allUsers || []).map((u: any) => u.user_id).filter(Boolean);
          scopeProfileIds = (allUsers || []).map((u: any) => u.id).filter(Boolean);
        } else {
          // account_manager or default
          scopeOwnerIds = [user.id];
          scopeProfileIds = myProfile?.id ? [myProfile.id] : [];
        }

        // Fetch opportunities data for scope
        let oppQuery = supabase
          .from("opportunities")
          .select("id, amount, status, stage, is_won, is_closed, expected_close_date")
          .in("owner_id", scopeOwnerIds);
        const { data: opportunities, error: oppError } = await oppQuery;
        if (oppError) throw oppError;

        // Calculate total revenue (won opportunities only)
        const wonOpps = (opportunities || []).filter(
          (opp: any) =>
            (opp.status === "won" || opp.is_won === true || opp.stage === "Closed Won") &&
            opp.status !== "archived"
        );
        const wonAmountForRevenue = wonOpps.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0) || 0;
        setTotalRevenue(wonAmountForRevenue);

        // Calculate margin from pipeline_items costs for won opportunities
        const wonOpportunityIds = wonOpps.map((opp: any) => opp.id);
        let totalMargin = 0;
        if (wonOpportunityIds.length > 0) {
          const { data: pipelineItems, error: pipelineError } = await supabase
            .from("pipeline_items")
            .select("opportunity_id, cost_of_goods, service_costs, other_expenses")
            .in("opportunity_id", wonOpportunityIds);
          if (pipelineError) throw pipelineError;
          const totalCosts = (pipelineItems || []).reduce((sum: number, item: any) => {
            const cogs = item.cost_of_goods || 0;
            const svc = item.service_costs || 0;
            const other = item.other_expenses || 0;
            return sum + cogs + svc + other;
          }, 0);
          totalMargin = wonAmountForRevenue - totalCosts;
        }

        // Calculate deals closed (won/lost) in scope
        const wonDeals = wonOpps.length;
        const lostDeals = (opportunities || []).filter(
          (opp: any) => opp.status === "lost" || opp.stage === "Closed Lost"
        ).length || 0;
        setDealsClosed({ won: wonDeals, lost: lostDeals });

        // Calculate team targets within current period
        const todayStr = new Date().toISOString().split("T")[0];
        let targetsRevenue = 0;
        let targetsMargin = 0;
        if (scopeProfileIds.length > 0) {
          const { data: teamTargets, error: targetError } = await supabase
            .from("sales_targets")
            .select("amount, measure, period_start, period_end")
            .in("assigned_to", scopeProfileIds)
            .lte("period_start", todayStr)
            .gte("period_end", todayStr);
          if (targetError) console.warn("Error fetching team targets:", targetError);
          (teamTargets || []).forEach((t: any) => {
            if (t.measure === "revenue") targetsRevenue += Number(t.amount) || 0;
            if (t.measure === "margin") targetsMargin += Number(t.amount) || 0;
          });
        }

        // Set achievement state (team-scoped for manager/head/admin; self for AM)
        const revenuePercentage = targetsRevenue > 0 ? (wonAmountForRevenue / targetsRevenue) * 100 : 0;
        const marginPercentage = targetsMargin > 0 ? (totalMargin / targetsMargin) * 100 : 0;
        setAchievement({
          revenue: { actual: wonAmountForRevenue, target: targetsRevenue, percentage: revenuePercentage },
          margin: { actual: totalMargin, target: targetsMargin, percentage: marginPercentage },
        });

        // Deals by stage (based on real pipeline items) for scope
        const PIPELINE_SIMPLE_STAGES = [
          "Prospecting",
          "Qualification",
          "Approach/Discovery",
          "Presentation/POC",
          "Proposal/Negotiation",
          "Closed Won",
          "Closed Lost",
        ];
        const normalizeEffectiveStage = (stage: string | null, status: string | null) => {
          if (status === "won") return "Closed Won";
          if (status === "lost") return "Closed Lost";
          const s = (stage || "Prospecting").replace(/\s*\/\s*/g, "/");
          return PIPELINE_SIMPLE_STAGES.includes(s) ? s : "Prospecting";
        };

        const { data: pipelineItems, error: pipelineError } = await supabase
          .from("pipeline_items")
          .select("amount, status, opportunity:opportunities!opportunity_id(owner_id, stage)")
          .in("opportunity.owner_id", scopeOwnerIds);
        if (!pipelineError && pipelineItems) {
          const pipelineTotal = pipelineItems.reduce(
            (sum: number, item: any) => sum + (item.amount || 0),
            0
          );
          setPipelineValue({ total: pipelineTotal, count: pipelineItems.length });

          const map: Record<string, { amount: number; count: number }> = {};
          PIPELINE_SIMPLE_STAGES.forEach((k) => {
            map[k] = { amount: 0, count: 0 };
          });

          pipelineItems.forEach((item: any) => {
            const eff = normalizeEffectiveStage(item.opportunity?.stage || null, item.status || null);
            map[eff].amount += item.amount || 0;
            map[eff].count += 1;
          });

          const stageData = PIPELINE_SIMPLE_STAGES.map((name) => ({
            name,
            amount: map[name].amount,
            count: map[name].count,
          }));
          setDealsByStage(stageData);
        }

        // Fetch activity summary (keep self metrics)
        const { data: activities, error: actError } = await supabase
          .from("sales_activity_v2")
          .select("activity_type")
          .eq("created_by", user.id);
        if (!actError && activities) {
          const activityCounts = activities.reduce(
            (acc: any, activity: any) => {
              if (activity.activity_type === "call") acc.calls++;
              else if (activity.activity_type === "meeting_online") acc.meetings++;
              else if (activity.activity_type === "visit") acc.visits++;
              return acc;
            },
            { calls: 0, meetings: 0, visits: 0 }
          );
          setActivitySummary(activityCounts);
        }

        // Fetch customer insights (new organizations this month)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const { data: newCustomers, error: customerError } = await supabase
          .from("organizations")
          .select("id")
          .eq("type", "customer")
          .gte("created_at", oneMonthAgo.toISOString());
        if (!customerError) {
          setCustomerInsights({ newCustomers: newCustomers?.length || 0 });
        }

        // Create alerts for upcoming close dates
        const upcomingDeals = (opportunities || []).filter((opp: any) => {
          if (!opp.expected_close_date) return false;
          const closeDate = new Date(opp.expected_close_date);
          const today = new Date();
          const diffDays = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 14;
        });
        setAlerts(
          upcomingDeals.map((opp: any) => ({
            message: `Deal closing soon: ${new Date(opp.expected_close_date).toLocaleDateString()}`,
            type: "warning",
          }))
        );
      } catch (err) {
        console.error("Error fetching sales summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Sales Summary</h2>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{dateRange}</span>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddProjectModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {loading ? "Loading..." : formatCurrency(achievement.revenue.actual)}
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +34% last period
            </div>
          </CardContent>
        </Card>

        {/* Total Margin */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Total Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {loading ? "Loading..." : formatCurrency(achievement.margin.actual)}
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +34% last period
            </div>
          </CardContent>
        </Card>

        {/* Deals Closed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Deals Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{dealsClosed.won + dealsClosed.lost}</div>
            <div className="text-sm text-muted-foreground">
              Won {dealsClosed.won} / Lost {dealsClosed.lost}
            </div>
          </CardContent>
        </Card>

        {/* Target Revenue vs Achievement */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Target Revenue vs Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={achievement.revenue.percentage} className="h-3" />
              <div className="flex justify-between mt-2">
                <span className="text-sm">{achievement.revenue.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Actual: {formatCurrency(achievement.revenue.actual)}</span>
              <span>Target: {formatCurrency(achievement.revenue.target)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Target Margin vs Achievement */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Target Margin vs Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={achievement.margin.percentage} className="h-3" />
              <div className="flex justify-between mt-2">
                <span className="text-sm">{achievement.margin.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Actual: {formatCurrency(achievement.margin.actual)}</span>
              <span>Target: {formatCurrency(achievement.margin.target)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold">{pipelineValue.count}</span>
              </div>
              <span className="text-sm text-muted-foreground">In process</span>
            </div>
            <div className="text-lg font-bold mb-2">{formatCurrency(pipelineValue.total)}</div>
            <div className="text-sm text-muted-foreground">Total Pipeline Value</div>
          </CardContent>
        </Card>

        {/* Deals by Stage (Pipeline) - Simple List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Deals by Stage (Pipeline)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {dealsByStage.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span>{s.name}</span>
                  <span>
                    {s.count || 0} deals • {formatCurrency(s.amount || 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Warnings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Alerts & Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm">New Customers</span>
              </div>
              <span className="font-bold text-lg">{customerInsights.newCustomers}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">Details</Button>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min((activitySummary.calls / 50) * 100, 100)} className="w-16 h-2" />
                  <span className="text-sm font-medium">{activitySummary.calls}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min((activitySummary.meetings / 50) * 100, 100)} className="w-16 h-2" />
                  <span className="text-sm font-medium">{activitySummary.meetings}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">Visits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min((activitySummary.visits / 50) * 100, 100)} className="w-16 h-2" />
                  <span className="text-sm font-medium">{activitySummary.visits}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddProjectModal open={showAddProjectModal} onOpenChange={setShowAddProjectModal} />
    </div>
  );
};

export default SalesSummary;
