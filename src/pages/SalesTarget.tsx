import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { AddTargetModal } from "@/components/modals/AddTargetModal";
import { useSalesTargets } from "@/hooks/useSalesTargets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

function SalesTarget() {
  const { profile } = useProfile();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const { targets, accountManagers, loading, fetchTargets } = useSalesTargets();

  const [amTableDataMargin, setAmTableDataMargin] = useState([]);
  const [amTableDataRevenue, setAmTableDataRevenue] = useState([]);

  // Actuals (Achieved) computed from won opportunities within selected period
  const [achievedTeamMargin, setAchievedTeamMargin] = useState(0);
  const [achievedTeamRevenue, setAchievedTeamRevenue] = useState(0);
  const [achievedByProfileMargin, setAchievedByProfileMargin] = useState<Record<string, number>>({});
  const [achievedByProfileRevenue, setAchievedByProfileRevenue] = useState<Record<string, number>>({});

  // Calculate dynamic period options - only show periods that have targets
  const availablePeriods = React.useMemo(() => {
    const periods = new Set<string>();

    // Only add periods from existing targets
    targets.forEach((target) => {
      if (target.period_start) {
        const startDate = new Date(target.period_start);
        const month = startDate.getMonth() + 1;
        const year = startDate.getFullYear();

        let quarter = 1;
        if (month >= 1 && month <= 3) quarter = 1;
        else if (month >= 4 && month <= 6) quarter = 2;
        else if (month >= 7 && month <= 9) quarter = 3;
        else if (month >= 10 && month <= 12) quarter = 4;

        periods.add(`Q${quarter} ${year}`);
      }
    });

    return Array.from(periods).sort((a, b) => {
      const [aQ, aY] = a.split(" ");
      const [bQ, bY] = b.split(" ");
      const aYear = parseInt(aY);
      const bYear = parseInt(bY);
      const aQuarter = parseInt(aQ.substring(1));
      const bQuarter = parseInt(bQ.substring(1));

      if (aYear !== bYear) return aYear - bYear;
      return aQuarter - bQuarter;
    });
  }, [targets]);

  // Initialize with first available period and fetch targets
  React.useEffect(() => {
    // Fetch all targets first (no period filter) to populate availablePeriods
    fetchTargets();
  }, []);

  // Update selectedPeriod when availablePeriods changes
  React.useEffect(() => {
    if (availablePeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods]);

  // Refetch targets when period changes
  React.useEffect(() => {
    if (selectedPeriod) {
      fetchTargets(selectedPeriod);
    }
  }, [selectedPeriod]);

  // Compute actuals (achieved revenue and margin) for selected period and team
  React.useEffect(() => {
    const computeActuals = async () => {
      if (!selectedPeriod || accountManagers.length === 0) {
        setAchievedTeamMargin(0);
        setAchievedTeamRevenue(0);
        setAchievedByProfileMargin({});
        setAchievedByProfileRevenue({});
        return;
      }

      const { start, end } = getQuarterRange(selectedPeriod);
      if (!start || !end) return;

      try {
        const amIds = accountManagers.map((am) => am.id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, user_id")
          .in("id", amIds);

        const profileToUser = new Map<string, string>();
        (profiles || []).forEach((p: any) => {
          if (p.id && p.user_id) profileToUser.set(p.id, p.user_id);
        });

        const ownerUserIds = Array.from(profileToUser.values());
        if (ownerUserIds.length === 0) {
          setAchievedTeamMargin(0);
          setAchievedTeamRevenue(0);
          setAchievedByProfileMargin({});
          setAchievedByProfileRevenue({});
          return;
        }

        const { data: opps } = await supabase
          .from("opportunities")
          .select("id, owner_id, amount, is_won, status, expected_close_date")
          .in("owner_id", ownerUserIds)
          .eq("is_won", true)
          .neq("status", "archived")
          .gte("expected_close_date", start)
          .lte("expected_close_date", end);

        const wonOpps = (opps || []) as any[];
        const oppIds = wonOpps.map((o) => o.id);

        const revenueByOwner: Record<string, number> = {};
        let totalRevenue = 0;
        wonOpps.forEach((o) => {
          const amt = Number(o.amount) || 0;
          totalRevenue += amt;
          const owner = o.owner_id;
          revenueByOwner[owner] = (revenueByOwner[owner] || 0) + amt;
        });

        let costsByOpp: Record<string, number> = {};
        if (oppIds.length > 0) {
          const { data: items } = await supabase
            .from("pipeline_items")
            .select("opportunity_id, cost_of_goods, service_costs, other_expenses")
            .in("opportunity_id", oppIds);

          (items || []).forEach((it: any) => {
            const cogs = Number(it.cost_of_goods) || 0;
            const svc = Number(it.service_costs) || 0;
            const other = Number(it.other_expenses) || 0;
            const total = cogs + svc + other;
            costsByOpp[it.opportunity_id] =
              (costsByOpp[it.opportunity_id] || 0) + total;
          });
        }

        const marginByOwner: Record<string, number> = {};
        let totalMargin = 0;
        wonOpps.forEach((o) => {
          const amt = Number(o.amount) || 0;
          const cost = costsByOpp[o.id] || 0;
          const margin = Math.max(0, amt - cost);
          totalMargin += margin;
          const owner = o.owner_id;
          marginByOwner[owner] = (marginByOwner[owner] || 0) + margin;
        });

        const userToProfile = new Map<string, string>();
        (profiles || []).forEach((p: any) => {
          if (p.id && p.user_id) userToProfile.set(p.user_id, p.id);
        });

        const achievedByProfileRevenue: Record<string, number> = {};
        const achievedByProfileMargin: Record<string, number> = {};

        Object.entries(revenueByOwner).forEach(([userId, rev]) => {
          const profileId = userToProfile.get(userId);
          if (profileId) achievedByProfileRevenue[profileId] = rev;
        });

        Object.entries(marginByOwner).forEach(([userId, mar]) => {
          const profileId = userToProfile.get(userId);
          if (profileId) achievedByProfileMargin[profileId] = mar;
        });

        setAchievedTeamRevenue(totalRevenue);
        setAchievedTeamMargin(totalMargin);
        setAchievedByProfileRevenue(achievedByProfileRevenue);
        setAchievedByProfileMargin(achievedByProfileMargin);
      } catch (e) {
        console.error("Error computing actuals:", e);
        setAchievedTeamRevenue(0);
        setAchievedTeamMargin(0);
        setAchievedByProfileRevenue({});
        setAchievedByProfileMargin({});
      }
    };

    computeActuals();
  }, [selectedPeriod, accountManagers]);

  // Calculate department metrics from real data (Margin Target)
  const departmentMetrics = React.useMemo(() => {
    if (!targets || targets.length === 0) {
      return {
        target: 0,
        achieved: 0,
        gap: 0,
      };
    }

    const targetMargin = targets.filter(
      (target) => target.measure === "margin"
    );

    const totalTarget = targetMargin.reduce(
      (sum, target) => sum + Number(target.amount),
      0
    );
    const achieved = achievedTeamMargin || 0;
    const gap = Math.max(0, totalTarget - achieved);

    return {
      target: totalTarget,
      achieved: achieved,
      gap: gap,
    };
  }, [targets, achievedTeamMargin]);

  // Calculate department metrics from real data (Margin Target)
  const departmentMetricsRevenue = React.useMemo(() => {
    if (!targets || targets.length === 0) {
      return {
        target: 0,
        achieved: 0,
        gap: 0,
      };
    }

    const targetRevenue = targets.filter(
      (target) => target.measure === "revenue"
    );

    const totalTarget = targetRevenue.reduce(
      (sum, target) => sum + Number(target.amount),
      0
    );
    const achieved = achievedTeamRevenue || 0;
    const gap = Math.max(0, totalTarget - achieved);

    return {
      target: totalTarget,
      achieved: achieved,
      gap: gap,
    };
  }, [targets, achievedTeamRevenue]);

  // Transform targets data for team performance chart (hierarchical)
  const amPerformanceData = React.useMemo(() => {
    if (!accountManagers || accountManagers.length === 0) return [];

    const roleOrder = { head: 0, manager: 1, account_manager: 2 };
    const data = accountManagers.map((am) => {
      const role = am.role || "account_manager";
      const roleLabel = role === "manager" ? "MGR" : role === "head" ? "HEAD" : "AM";
      const displayName = `${am.full_name} (${roleLabel})`;
      const value = achievedByProfileRevenue[am.id] ?? 0;
      return { name: displayName, value, role };
    });

    return data.sort((a, b) => {
      const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] || 3) -
        (roleOrder[b.role as keyof typeof roleOrder] || 3);
      if (roleCompare !== 0) return roleCompare;
      return b.value - a.value;
    });
  }, [accountManagers, achievedByProfileRevenue]);

  // Calculate attainment percentage from real data
  const attainmentData = React.useMemo(() => {
    const achievementRate =
      departmentMetrics.target > 0
        ? (departmentMetrics.achieved / departmentMetrics.target) * 100
        : 0;
    return [
      {
        name: "Achieved",
        value: Math.round(achievementRate),
        fill: "hsl(var(--primary))",
      },
      {
        name: "Remaining",
        value: Math.round(100 - achievementRate),
        fill: "hsl(var(--muted))",
      },
    ];
  }, [departmentMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper: get quarter start/end (YYYY-MM-DD) from period label like "Q3 2025"
  const getQuarterRange = (period: string) => {
    const m = period.match(/Q([1-4])\s+(\d{4})/);
    if (!m) return { start: "", end: "" };
    const q = parseInt(m[1], 10);
    const year = parseInt(m[2], 10);
    const startIdx = (q - 1) * 3; // 0-based index
    const start = new Date(year, startIdx, 1);
    const end = new Date(year, startIdx + 3, 0);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    return { start: fmt(start), end: fmt(end) };
  };

  const amTableDataMegrinCal = React.useMemo(() => {
    const roleOrder = { head: 0, manager: 1, account_manager: 2 };

    // Default all team members (even if no targets)
    const allMembers = accountManagers.map((am) => ({
      am: am.full_name,
      amId: am.id,
      role: am.role || "account_manager",
      monthlyTarget: 0,
      quarterlyTarget: 0,
      achieved: 0,
      gap: 0,
      status: "No Target",
      measure: "margin",
    }));

    // Jika tidak ada target, langsung return sorted members
    const allTargetMargin = targets.filter(
      (target) => target.measure === "margin"
    );
    if (!allTargetMargin || allTargetMargin.length === 0) {
      return allMembers.sort(
        (a, b) =>
          (roleOrder[a.role as keyof typeof roleOrder] || 3) -
          (roleOrder[b.role as keyof typeof roleOrder] || 3)
      );
    }

    // Grouping targets berdasarkan member
    const targetsByMember = allTargetMargin.reduce((acc, target) => {
      const memberId = target.assigned_to;
      if (!memberId) return acc;

      // Cari member di daftar utama
      const member = accountManagers.find((am) => am.id === memberId);
      const targetMember = target.account_manager || target.assigned_user;

      // Inisialisasi data member jika belum ada
      if (!acc[memberId]) {
        acc[memberId] = {
          am: member?.full_name || targetMember?.full_name || "Unknown",
          amId: memberId,
          role: member?.role || targetMember?.role || "account_manager",
          monthlyTarget: 0,
          quarterlyTarget: 0,
          achieved: 0,
          gap: 0,
          status: "No Target",
          measure: target.measure || "revenue",
        };
      }

      // Validasi periode
      const periodStart = new Date(target.period_start);
      const periodEnd = new Date(target.period_end);
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        console.warn("Invalid target period:", target);
        return acc;
      }

      // Hitung selisih bulan
      const monthsDiff =
        (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 +
        (periodEnd.getMonth() - periodStart.getMonth()) +
        1;
      const safeMonths = Math.max(monthsDiff, 1);

      // Hitung nilai per bulan & kuartal
      const amount = Number(target.amount) || 0;
      const monthlyAmount = amount / safeMonths;
      const quarterlyAmount = amount / Math.max(Math.ceil(safeMonths / 3), 1);

      // Hitung pencapaian
      const achieved = achievedByProfileMargin[memberId] ?? 0;

      const current = acc[memberId];
      current.monthlyTarget += monthlyAmount;
      current.quarterlyTarget += quarterlyAmount;
      current.achieved = achieved;

      return acc;
    }, {} as Record<string, any>);

    // Gabungkan semua member dengan data target-nya
    const result = allMembers.map((member) => {
      const targetData = targetsByMember[member.amId];
      if (targetData) {
        const gap = targetData.quarterlyTarget - targetData.achieved;
        let status = "Behind";
        if (gap <= 0) status = "On Track";
        if (targetData.achieved > targetData.quarterlyTarget * 1.05)
          status = "Ahead"; // >105% dianggap lebih
        return { ...targetData, gap, status };
      }
      return member;
    });

    // Sort by hierarchy, lalu berdasarkan target
    return result.sort((a, b) => {
      const roleCompare =
        (roleOrder[a.role as keyof typeof roleOrder] || 3) -
        (roleOrder[b.role as keyof typeof roleOrder] || 3);
      if (roleCompare !== 0) return roleCompare;
      if (b.quarterlyTarget !== a.quarterlyTarget)
        return b.quarterlyTarget - a.quarterlyTarget;
      return a.am.localeCompare(b.am);
    });
  }, [targets, accountManagers]);

  const amTableDataRevenueCalc = React.useMemo(() => {
    const roleOrder = { head: 0, manager: 1, account_manager: 2 };

    // Default all team members (even if no targets)
    const allMembers = accountManagers.map((am) => ({
      am: am.full_name,
      amId: am.id,
      role: am.role || "account_manager",
      monthlyTarget: 0,
      quarterlyTarget: 0,
      achieved: 0,
      gap: 0,
      status: "No Target",
      measure: "revenue",
    }));

    // Jika tidak ada target, langsung return sorted members
    const allTargetRevenue = targets.filter(
      (target) => target.measure === "revenue"
    );
    if (!allTargetRevenue || allTargetRevenue.length === 0) {
      return allMembers.sort(
        (a, b) =>
          (roleOrder[a.role as keyof typeof roleOrder] || 3) -
          (roleOrder[b.role as keyof typeof roleOrder] || 3)
      );
    }

    // Grouping targets berdasarkan member
    const targetsByMember = allTargetRevenue.reduce((acc, target) => {
      const memberId = target.assigned_to;
      if (!memberId) return acc;

      // Cari member di daftar utama
      const member = accountManagers.find((am) => am.id === memberId);
      const targetMember = target.account_manager || target.assigned_user;

      // Inisialisasi data member jika belum ada
      if (!acc[memberId]) {
        acc[memberId] = {
          am: member?.full_name || targetMember?.full_name || "Unknown",
          amId: memberId,
          role: member?.role || targetMember?.role || "account_manager",
          monthlyTarget: 0,
          quarterlyTarget: 0,
          achieved: 0,
          gap: 0,
          status: "No Target",
          measure: target.measure || "revenue",
        };
      }

      // Validasi periode
      const periodStart = new Date(target.period_start);
      const periodEnd = new Date(target.period_end);
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        console.warn("Invalid target period:", target);
        return acc;
      }

      // Hitung selisih bulan
      const monthsDiff =
        (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 +
        (periodEnd.getMonth() - periodStart.getMonth()) +
        1;
      const safeMonths = Math.max(monthsDiff, 1);

      // Hitung nilai per bulan & kuartal
      const amount = Number(target.amount) || 0;
      const monthlyAmount = amount / safeMonths;
      const quarterlyAmount = amount / Math.max(Math.ceil(safeMonths / 3), 1);

      // Hitung pencapaian
      const achieved = achievedByProfileRevenue[memberId] ?? 0;

      const current = acc[memberId];
      current.monthlyTarget += monthlyAmount;
      current.quarterlyTarget += quarterlyAmount;
      current.achieved = achieved;

      return acc;
    }, {} as Record<string, any>);

    // Gabungkan semua member dengan data target-nya
    const result = allMembers.map((member) => {
      const targetData = targetsByMember[member.amId];
      if (targetData) {
        const gap = targetData.quarterlyTarget - targetData.achieved;
        let status = "Behind";
        if (gap <= 0) status = "On Track";
        if (targetData.achieved > targetData.quarterlyTarget * 1.05)
          status = "Ahead"; // >105% dianggap lebih
        return { ...targetData, gap, status };
      }
      return member;
    });

    // Sort by hierarchy, lalu berdasarkan target
    return result.sort((a, b) => {
      const roleCompare =
        (roleOrder[a.role as keyof typeof roleOrder] || 3) -
        (roleOrder[b.role as keyof typeof roleOrder] || 3);
      if (roleCompare !== 0) return roleCompare;
      if (b.quarterlyTarget !== a.quarterlyTarget)
        return b.quarterlyTarget - a.quarterlyTarget;
      return a.am.localeCompare(b.am);
    });
  }, [targets, accountManagers]);

  React.useEffect(() => {
    // Pisahkan berdasarkan measure
    const amTableDataMargin = amTableDataMegrinCal.filter(
      (item) => item.measure === "margin"
    );
    const amTableDataRevenue = amTableDataRevenueCalc.filter(
      (item) => item.measure === "revenue"
    );

    setAmTableDataMargin(amTableDataMargin);
    setAmTableDataRevenue(amTableDataRevenue);
  }, [amTableDataRevenueCalc, amTableDataMegrinCal]);

  const pageTitle =
    profile?.role === "head" ? "Manager Target" : "Sales Target";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          <Button className="gap-2" onClick={() => setIsAddTargetOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Target
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period</span>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margin Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetrics.target)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margin Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetrics.achieved)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margin Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetrics.gap)}
            </div>
          </CardContent>
        </Card>

        {/* REVENUE */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetricsRevenue.target)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetricsRevenue.achieved)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(departmentMetricsRevenue.gap)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={amPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={11}
                    />
                    <YAxis fontSize={12} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Attainment</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={attainmentData}
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={450}
                    dataKey="value"
                  >
                    {attainmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {attainmentData[0]?.value || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {/* Margin */}
      <Card>
        <CardHeader>
          <CardTitle>Margin</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Monthly Target (IDR)</TableHead>
                <TableHead>Quarterly Target (IDR)</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading targets...
                  </TableCell>
                </TableRow>
              ) : amTableDataMargin.length > 0 ? (
                amTableDataMargin.map((row, index) => {
                  const roleLabel =
                    row.role === "manager"
                      ? "Manager"
                      : row.role === "head"
                      ? "Head"
                      : "Account Manager";
                  const bgClass =
                    row.role === "head"
                      ? "bg-muted/50"
                      : row.role === "manager"
                      ? "bg-muted/30"
                      : "";

                  return (
                    <TableRow key={row.amId || index} className={bgClass}>
                      <TableCell className="font-medium">{row.am}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground whitespace-nowrap">
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(row.monthlyTarget)}</TableCell>
                      <TableCell>
                        {formatCurrency(row.quarterlyTarget)}
                      </TableCell>
                      <TableCell>{formatCurrency(row.achieved)}</TableCell>
                      <TableCell
                        className={
                          row.gap > 0 ? "text-red-600" : "text-green-600"
                        }
                      >
                        {formatCurrency(Math.abs(row.gap))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.status === "On Track"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No team members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Monthly Target (IDR)</TableHead>
                <TableHead>Quarterly Target (IDR)</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading targets...
                  </TableCell>
                </TableRow>
              ) : amTableDataRevenue.length > 0 ? (
                amTableDataRevenue.map((row, index) => {
                  const roleLabel =
                    row.role === "manager"
                      ? "Manager"
                      : row.role === "head"
                      ? "Head"
                      : "Account Manager";
                  const bgClass =
                    row.role === "head"
                      ? "bg-muted/50"
                      : row.role === "manager"
                      ? "bg-muted/30"
                      : "";

                  return (
                    <TableRow key={row.amId || index} className={bgClass}>
                      <TableCell className="font-medium">{row.am}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground whitespace-nowrap">
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(row.monthlyTarget)}</TableCell>
                      <TableCell>
                        {formatCurrency(row.quarterlyTarget)}
                      </TableCell>
                      <TableCell>{formatCurrency(row.achieved)}</TableCell>
                      <TableCell
                        className={
                          row.gap > 0 ? "text-red-600" : "text-green-600"
                        }
                      >
                        {formatCurrency(Math.abs(row.gap))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.status === "On Track"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No team members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Target Modal */}
      <AddTargetModal
        open={isAddTargetOpen}
        onOpenChange={setIsAddTargetOpen}
        onTargetAdded={() => {
          // First fetch all targets to update available periods
          fetchTargets();
          // Then fetch for current selected period if it exists
          if (selectedPeriod) {
            setTimeout(() => fetchTargets(selectedPeriod), 100);
          }
        }}
      />
    </div>
  );
}

export default SalesTarget;
