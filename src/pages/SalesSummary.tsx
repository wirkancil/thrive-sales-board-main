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
import useTargetAchievement from "@/hooks/useTargetAchivement";

const SalesSummary = () => {
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dealsClosed, setDealsClosed] = useState({ won: 0, lost: 0 });
  const [targetAchievement, setTargetAchievement] = useState({
    actual: 0,
    target: 0,
    percentage: 0,
  });
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
  const achievement = useTargetAchievement(user);
  console.log("achievement", achievement);

  const dateRange = "Sep 1 - Sep 30, 2025";

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch opportunities data
        const { data: opportunities, error: oppError } = await supabase
          .from("opportunities")
          .select(
            "amount, status, stage, is_won, is_closed, expected_close_date"
          )
          .eq("owner_id", user.id);

        if (oppError) throw oppError;

        // Calculate total revenue (won opportunities only)
        console.log("opportunities: ", opportunities);

        const wonAmountForRevenue =
          opportunities
            ?.filter((opp) => opp.status === "won" || opp.is_won === true)
            .reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;
        setTotalRevenue(wonAmountForRevenue);

        // Calculate deals closed (won/lost)
        const wonDeals =
          opportunities?.filter(
            (opp) =>
              opp.status === "won" ||
              opp.is_won === true ||
              opp.stage === "Closed Won"
          ).length || 0;
        const lostDeals =
          opportunities?.filter(
            (opp) => opp.status === "lost" || opp.stage === "Closed Lost"
          ).length || 0;
        setDealsClosed({ won: wonDeals, lost: lostDeals });

        // Calculate actual achievement (only won deals)
        const wonAmount =
          opportunities
            ?.filter((opp) => opp.status === "won" || opp.is_won === true)
            .reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;

        // Fetch sales target for current user with better error handling
        const { data: salesTargets, error: targetError } = await supabase
          .from("sales_targets")
          .select(
            `
            amount,
            period_start,
            period_end,
            measure,
            created_at
          `
          )
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (targetError) {
          console.error("Error fetching sales target:", targetError);
        } else {
          console.log("Sales targets fetched:", salesTargets);
        }

        // Calculate target achievement using won deals vs target
        const targetAmount = salesTargets?.[0]?.amount || 0;
        const percentage =
          targetAmount > 0 ? (wonAmount / targetAmount) * 100 : 0;
        setTargetAchievement({
          actual: wonAmount, // Use won deals amount for achievement
          target: targetAmount,
          percentage,
        });

        // Deals by stage (simple, based on real pipeline items)
        // We will compute using pipeline_items to match Pipeline page exactly
        const PIPELINE_SIMPLE_STAGES = [
          "Prospecting",
          "Qualification",
          "Approach/Discovery",
          "Presentation/POC",
          "Proposal/Negotiation",
          "Closed Won",
          "Closed Lost",
        ];
        const normalizeEffectiveStage = (
          stage: string | null,
          status: string | null
        ) => {
          if (status === "won") return "Closed Won";
          if (status === "lost") return "Closed Lost";
          const s = (stage || "Prospecting").replace(/\s*\/\s*/g, "/");
          return PIPELINE_SIMPLE_STAGES.includes(s) ? s : "Prospecting";
        };

        // Fetch pipeline items for pipeline value
        const { data: pipelineItems, error: pipelineError } = await supabase
          .from("pipeline_items")
          .select(
            `
            amount,
            status,
            opportunity:opportunities!opportunity_id(owner_id, stage)
          `
          )
          .eq("opportunity.owner_id", user.id);

        if (!pipelineError && pipelineItems) {
          const pipelineTotal = pipelineItems.reduce(
            (sum, item) => sum + (item.amount || 0),
            0
          );
          setPipelineValue({
            total: pipelineTotal,
            count: pipelineItems.length,
          });

          const map: Record<string, { amount: number; count: number }> = {};
          PIPELINE_SIMPLE_STAGES.forEach((k) => {
            map[k] = { amount: 0, count: 0 };
          });

          pipelineItems.forEach((item) => {
            const eff = normalizeEffectiveStage(
              item.opportunity?.stage || null,
              item.status || null
            );
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

        // Fetch activity summary
        const { data: activities, error: actError } = await supabase
          .from("sales_activity_v2")
          .select("activity_type")
          .eq("created_by", user.id);

        if (!actError && activities) {
          const activityCounts = activities.reduce(
            (acc, activity) => {
              if (activity.activity_type === "call") acc.calls++;
              else if (activity.activity_type === "meeting_online")
                acc.meetings++;
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
        const upcomingDeals =
          opportunities?.filter((opp) => {
            if (!opp.expected_close_date) return false;
            const closeDate = new Date(opp.expected_close_date);
            const today = new Date();
            const diffDays = Math.ceil(
              (closeDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
            );
            return diffDays <= 14 && diffDays >= 0;
          }) || [];

        const alertsData = [
          {
            count: upcomingDeals.length,
            text: "opportunities within 14 days of expected close date",
          },
        ];
        setAlerts(alertsData);

        // Top Performers berbasis poin (earns points) dari stage metrics
        // Ambil entity pengguna untuk membatasi ke dalam entitas yang sama
        const { data: myProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, entity_id, full_name, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        // Tentukan cakupan owner berdasarkan role
        let allowedOwnerIds: string[] = [];
        try {
          if (myProfile?.role === "manager") {
            const { data: teamMembers } = await supabase
              .from("manager_team_members")
              .select("account_manager_id")
              .eq("manager_id", user.id);
            const teamIds = (teamMembers || []).map(
              (m) => m.account_manager_id
            );
            allowedOwnerIds = Array.from(new Set([user.id, ...teamIds]));
          } else if (
            myProfile?.role === "head" ||
            myProfile?.role === "admin"
          ) {
            const { data: entityMembers } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("entity_id", myProfile.entity_id);
            allowedOwnerIds = (entityMembers || []).map((m) => m.id);
          } else {
            // account_manager: coba perluas ke semua member satu entitas
            const { data: entityMembers } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("entity_id", myProfile?.entity_id);
            allowedOwnerIds = (entityMembers || []).map((m) => m.id);
          }
        } catch (e) {
          console.warn("Role-based scope error:", e);
        }

        // Ambil opportunity_stage_metrics sesuai cakupan owner
        let metricsQuery = supabase
          .from("opportunity_stage_metrics")
          .select("owner_id, owner_name, stage, points, is_overdue");
        if (allowedOwnerIds && allowedOwnerIds.length > 0) {
          metricsQuery = metricsQuery.in("owner_id", allowedOwnerIds);
        }
        const { data: stageMetrics, error: metricsError } = await metricsQuery;
        if (metricsError) throw metricsError;

        const ownerIds = Array.from(
          new Set(
            (stageMetrics || [])
              .map((m) => m.owner_id)
              .filter((id: string | null) => !!id)
          )
        );

        const { data: ownerProfiles, error: ownersError } = await supabase
          .from("user_profiles")
          .select("id, full_name, entity_id")
          .in("id", ownerIds);

        if (ownersError) {
          console.error("Error fetching owner profiles:", ownersError);
        }

        const ownersMap = new Map((ownerProfiles || []).map((p) => [p.id, p]));

        const filteredMetrics = (stageMetrics || []).filter((m) => {
          const ownerId = m.owner_id;
          const owner = ownerId ? ownersMap.get(ownerId) : null;
          return (
            owner &&
            (!myProfile?.entity_id || owner.entity_id === myProfile.entity_id)
          );
        });

        // Agregasi poin per pemilik (owner). Poin hanya dihitung jika tidak overdue dan bukan 'Closed Lost'.
        const performerPoints = new Map<
          string,
          { name: string; points: number; items: number }
        >();
        filteredMetrics.forEach((m) => {
          if (m.stage === "Closed Lost") return; // tidak ada poin untuk lost
          const award = m.is_overdue ? 0 : m.points || 0;
          const ownerId = m.owner_id;
          const owner = ownerId ? ownersMap.get(ownerId) : null;
          const ownerName = owner?.full_name || m.owner_name || "Unknown";
          const existing = performerPoints.get(ownerId) || {
            name: ownerName,
            points: 0,
            items: 0,
          };
          existing.points += award;
          existing.items += 1;
          performerPoints.set(ownerId, existing);
        });

        let topPerformersReal = Array.from(performerPoints.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
          .map((p, idx) => ({
            rank: idx + 1,
            name: p.name,
            score: `${p.points} pts`,
          }));

        // Fallback: jika tidak ada data (karena RLS atau memang kosong), tampilkan performa user sendiri
        if (!topPerformersReal || topPerformersReal.length === 0) {
          // Fallback: hitung poin untuk user sendiri dari stage metrics
          const { data: myMetrics } = await supabase
            .from("opportunity_stage_metrics")
            .select("stage, points, is_overdue")
            .eq("owner_id", user.id);

          const myPoints = (myMetrics || []).reduce((sum: number, m) => {
            if (m.stage === "Closed Lost") return sum;
            const award = m.is_overdue ? 0 : m.points || 0;
            return sum + award;
          }, 0);

          const displayName = myProfile
            ? myProfile.full_name || "Anda"
            : "Anda";
          topPerformersReal =
            myPoints > 0
              ? [{ rank: 1, name: displayName, score: `${myPoints} pts` }]
              : [];
        }

        setTopPerformers(topPerformersReal);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Set up real-time subscription for sales targets
    const targetsSubscription = supabase
      .channel("sales-targets-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "sales_targets",
          filter: `assigned_to=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Sales target changed:", payload);
          // Refetch data when targets change
          fetchAllData();
        }
      )
      .subscribe();

    // Set up real-time subscription for opportunities
    const opportunitiesSubscription = supabase
      .channel("opportunities-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "opportunities",
          filter: `owner_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Opportunity changed:", payload);
          // Refetch data when opportunities change
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(targetsSubscription);
      supabase.removeChannel(opportunitiesSubscription);
    };
  }, [user]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Accounts Receivable Data
  const arMetrics = [
    {
      title: "Balance",
      value: "16.8M",
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Within Due",
      value: "7.8M",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Overdue",
      value: "9.0M",
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "Overdue %",
      value: "53.6%",
      icon: Percent,
      color: "text-red-600",
    },
    { title: "DSO", value: "63", icon: Info, color: "text-blue-600" },
  ];

  const ageAnalysisData = [
    { name: "Within Due", value: 7.8, color: "#3b82f6" },
    { name: "Overdue 0-30 Days", value: 3.7, color: "#ef4444" },
    { name: "Overdue 31-60 Days", value: 2.5, color: "#ef4444" },
    { name: "Overdue 61-90 Days", value: 1.1, color: "#ef4444" },
    { name: "Due Over 90 Days", value: 1.7, color: "#ef4444" },
  ];

  const regionBreakupData = [
    { name: "North America", value: 3.9, color: "#06b6d4" },
    { name: "Europe", value: 2.8, color: "#0ea5e9" },
    { name: "Pacific", value: 2.3, color: "#0284c7" },
  ];

  const statusData = [
    { name: "Overdue", value: 44, color: "#ef4444" },
    { name: "Bad Debt", value: 10, color: "#dc2626" },
    { name: "On Time Payments", value: 46, color: "#3b82f6" },
  ];

  const trendData = [
    { month: "I", withinDue: 1.9, overdue: 0.8, creditSales: 2.7 },
    { month: "II", withinDue: 2.6, overdue: 1.0, creditSales: 3.6 },
    { month: "III", withinDue: 3.0, overdue: 1.2, creditSales: 4.2 },
    { month: "IV", withinDue: 3.2, overdue: 1.4, creditSales: 4.6 },
    { month: "V", withinDue: 3.7, overdue: 1.6, creditSales: 5.3 },
    { month: "VI", withinDue: 4.6, overdue: 1.8, creditSales: 6.4 },
    { month: "VII", withinDue: 4.2, overdue: 2.0, creditSales: 6.2 },
    { month: "VIII", withinDue: 4.1, overdue: 2.2, creditSales: 6.3 },
    { month: "IX", withinDue: 5.4, overdue: 2.4, creditSales: 7.8 },
    { month: "X", withinDue: 5.2, overdue: 2.6, creditSales: 7.8 },
    { month: "XI", withinDue: 6.0, overdue: 2.8, creditSales: 8.8 },
    { month: "XII", withinDue: 5.8, overdue: 3.0, creditSales: 8.8 },
  ];

  const cashFlowData = [
    { month: "I", actual: 3.4, estimated: 0, forecasted: 0 },
    { month: "II", actual: 4.6, estimated: 0, forecasted: 0 },
    { month: "III", actual: 4.7, estimated: 0, forecasted: 0 },
    { month: "IV", actual: 3.9, estimated: 4.2, forecasted: 0 },
    { month: "V", actual: 3.6, estimated: 3.7, forecasted: 0 },
    { month: "VI", actual: 4.6, estimated: 4.6, forecasted: 0 },
    { month: "VII", actual: 4.5, estimated: 4.5, forecasted: 0 },
    { month: "VIII", actual: 4.6, estimated: 4.8, forecasted: 0 },
    { month: "IX", actual: 4.8, estimated: 4.9, forecasted: 0 },
    { month: "X", actual: 4.2, estimated: 4.9, forecasted: 5.0 },
    { month: "XI", actual: 0, estimated: 0, forecasted: 4.7 },
    { month: "XII", actual: 0, estimated: 0, forecasted: 4.6 },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Sales Summary</h2>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{dateRange}</span>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddProjectModal(true)}
          >
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
            <CardTitle className="text-base font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {loading
                ? "Loading..."
                : formatCurrency(achievement.revenue.actual)}
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +34% last period 1847
            </div>
          </CardContent>
        </Card>

        {/* Total Margin */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Total Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {loading
                ? "Loading..."
                : formatCurrency(achievement.margin.actual)}
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +34% last period 1847
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
            <div className="text-2xl font-bold mb-2">
              {dealsClosed.won + dealsClosed.lost}
            </div>
            <div className="text-sm text-muted-foreground">
              Won {dealsClosed.won} / Lost {dealsClosed.lost}
            </div>
          </CardContent>
        </Card>

        {/* Target vs Achievement */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Target Revenue vs Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress
                value={achievement.revenue.percentage}
                className="h-3"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm">
                  {achievement.revenue.percentage.toFixed(1)}%
                </span>
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
            <CardTitle className="text-base font-medium">
              Target Margin vs Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={achievement.margin.percentage} className="h-3" />
              <div className="flex justify-between mt-2">
                <span className="text-sm">
                  {achievement.margin.percentage.toFixed(1)}%
                </span>
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
            <CardTitle className="text-base font-medium">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold">
                  {pipelineValue.count}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">In process</span>
            </div>
            <div className="text-lg font-bold mb-2">
              {formatCurrency(pipelineValue.total)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Pipeline Value
            </div>
          </CardContent>
        </Card>

        {/* Deals by Stage (Pipeline) - Simple List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Deals by Stage (Pipeline)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {dealsByStage.map((s) => (
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

        {/* Deals by Stage Pie removed for simplicity */}

        {/* Top Performers */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Rank</span>
                <span>Account manager</span>
              </div>
              {topPerformers.map((performer) => (
                <div
                  key={performer.rank}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={performer.rank <= 3 ? "default" : "secondary"}
                      className={
                        performer.rank === 1
                          ? "bg-yellow-500"
                          : performer.rank === 2
                          ? "bg-gray-400"
                          : performer.rank === 3
                          ? "bg-amber-600"
                          : ""
                      }
                    >
                      {performer.rank}
                    </Badge>
                    <span className="text-sm">{performer.name}</span>
                  </div>
                  <span className="text-sm font-medium">{performer.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Warnings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Alerts & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <span className="font-semibold text-orange-500">
                      {alert.count}
                    </span>
                    <span className="text-sm ml-1">{alert.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm">New Customers</span>
              </div>
              <span className="font-bold text-lg">
                {customerInsights.newCustomers}
              </span>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Details
            </Button>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min((activitySummary.calls / 50) * 100, 100)}
                    className="w-16 h-2"
                  />
                  <span className="text-sm font-medium">
                    {activitySummary.calls}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min((activitySummary.meetings / 50) * 100, 100)}
                    className="w-16 h-2"
                  />
                  <span className="text-sm font-medium">
                    {activitySummary.meetings}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">Visits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min((activitySummary.visits / 50) * 100, 100)}
                    className="w-16 h-2"
                  />
                  <span className="text-sm font-medium">
                    {activitySummary.visits}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Receivable Overview */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          Accounts Receivable Overview
        </h2>

        {/* AR Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-blue-50 p-6 rounded-lg">
          {arMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600">{metric.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Age Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-blue-600">
                Age Analysis of Due Balance
              </CardTitle>
              <p className="text-sm text-muted-foreground">(Million USD)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ageAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Region Breakup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-blue-600">
                Overdue Breakup by Region
              </CardTitle>
              <p className="text-sm text-muted-foreground">(Million USD)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={regionBreakupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {regionBreakupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Outstanding by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-blue-600">
                Outstanding by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit Sales vs Balance Due Trend */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-medium text-blue-600">
                Credit Sales vs Balance Due Trend T13M
              </CardTitle>
              <p className="text-sm text-muted-foreground">(Million USD)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Legend />
                  <Bar
                    dataKey="withinDue"
                    stackId="a"
                    fill="#3b82f6"
                    name="Within Due"
                  />
                  <Bar
                    dataKey="overdue"
                    stackId="a"
                    fill="#ef4444"
                    name="Overdue"
                  />
                  <Line
                    dataKey="creditSales"
                    stroke="#f59e0b"
                    name="Credit Sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash Inflow Forecast */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-medium text-blue-600">
                Actual vs Estimated Cash Inflow With 3 Months Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Legend />
                  <Bar dataKey="actual" fill="#1f2937" name="Actual Receipts" />
                  <Bar
                    dataKey="estimated"
                    fill="#3b82f6"
                    name="Estimated Receipts"
                  />
                  <Bar
                    dataKey="forecasted"
                    fill="#f59e0b"
                    name="Forecasted Receipts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddProjectModal
        open={showAddProjectModal}
        onOpenChange={setShowAddProjectModal}
      />
    </div>
  );
};

export default SalesSummary;
