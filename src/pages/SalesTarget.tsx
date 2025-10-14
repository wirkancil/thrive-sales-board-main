import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AddTargetModal } from '@/components/modals/AddTargetModal';
import { useSalesTargets } from '@/hooks/useSalesTargets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProfile } from '@/hooks/useProfile';

function SalesTarget() {
  const { profile } = useProfile();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const { targets, accountManagers, loading, fetchTargets } = useSalesTargets();

  // Calculate dynamic period options - only show periods that have targets
  const availablePeriods = React.useMemo(() => {
    const periods = new Set<string>();
    
    // Only add periods from existing targets
    targets.forEach(target => {
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
      const [aQ, aY] = a.split(' ');
      const [bQ, bY] = b.split(' ');
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
  
  // Calculate department metrics from real data
  const departmentMetrics = React.useMemo(() => {
    if (!targets || targets.length === 0) {
      return {
        target: 0,
        achieved: 0,
        gap: 0
      };
    }
    
    const totalTarget = targets.reduce((sum, target) => sum + Number(target.amount), 0);
    // For now, using mock achieved data - this could come from deals/pipeline data
    const achieved = totalTarget * 0.704; // 70.4% achievement rate
    const gap = totalTarget - achieved;
    
    return {
      target: totalTarget,
      achieved: achieved,
      gap: gap
    };
  }, [targets]);
  
  // Transform targets data for team performance chart (hierarchical)
  const amPerformanceData = React.useMemo(() => {
    if (!targets || targets.length === 0) return [];
    
    const targetsByAM = targets.reduce((acc, target) => {
      const member = target.account_manager || target.assigned_user;
      const name = member?.full_name || 'Unknown';
      const role = member?.role || 'account_manager';
      const roleLabel = role === 'manager' ? 'MGR' : role === 'head' ? 'HEAD' : 'AM';
      const displayName = `${name} (${roleLabel})`;
      
      if (!acc[displayName]) {
        acc[displayName] = { value: 0, role };
      }
      acc[displayName].value += Number(target.amount);
      return acc;
    }, {} as Record<string, { value: number; role: string }>);

    // Sort by role hierarchy (head > manager > account_manager)
    const roleOrder = { head: 0, manager: 1, account_manager: 2 };
    return Object.entries(targetsByAM)
      .map(([name, data]) => ({
        name,
        value: data.value * 0.704, // Mock 70.4% achievement rate
        role: data.role
      }))
      .sort((a, b) => {
        const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] || 3) - 
                           (roleOrder[b.role as keyof typeof roleOrder] || 3);
        return roleCompare !== 0 ? roleCompare : b.value - a.value;
      });
  }, [targets]);

  // Calculate attainment percentage from real data
  const attainmentData = React.useMemo(() => {
    const achievementRate = departmentMetrics.target > 0 ? (departmentMetrics.achieved / departmentMetrics.target) * 100 : 0;
    return [
      { name: 'Achieved', value: Math.round(achievementRate), fill: 'hsl(var(--primary))' },
      { name: 'Remaining', value: Math.round(100 - achievementRate), fill: 'hsl(var(--muted))' }
    ];
  }, [departmentMetrics]);

  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Transform targets data for team table - Group by team member and aggregate (hierarchical)
  const amTableData = React.useMemo(() => {
    // Start with all team members
    const allMembers = accountManagers.map(am => ({
      am: am.full_name,
      amId: am.id,
      role: am.role || 'account_manager',
      monthlyTarget: 0,
      quarterlyTarget: 0,
      achieved: 0,
      gap: 0,
      status: 'On Track'
    }));
    
    if (!targets || targets.length === 0) {
      // Sort by role hierarchy even with no targets
      const roleOrder = { head: 0, manager: 1, account_manager: 2 };
      return allMembers.sort((a, b) => 
        (roleOrder[a.role as keyof typeof roleOrder] || 3) - 
        (roleOrder[b.role as keyof typeof roleOrder] || 3)
      );
    }
    
    const targetsByMember = targets.reduce((acc, target) => {
      const memberId = target.assigned_to;
      
      if (!acc[memberId]) {
        const member = accountManagers.find(am => am.id === memberId);
        const targetMember = target.account_manager || target.assigned_user;
        acc[memberId] = {
          am: member?.full_name || targetMember?.full_name || 'Unknown',
          amId: memberId,
          role: member?.role || targetMember?.role || 'account_manager',
          monthlyTarget: 0,
          quarterlyTarget: 0,
          achieved: 0,
          gap: 0,
          status: 'On Track'
        };
      }
      
      // Calculate period length in months
      const periodStart = new Date(target.period_start);
      const periodEnd = new Date(target.period_end);
      const monthsDiff = (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 + (periodEnd.getMonth() - periodStart.getMonth()) + 1;
      
      // Calculate monthly and quarterly amounts based on actual period
      const monthlyAmount = Number(target.amount) / monthsDiff;
      const quarterlyAmount = Number(target.amount) / Math.ceil(monthsDiff / 3);
      const achieved = Number(target.amount) * 0.704; // Mock 70.4% achievement rate
      
      const currentEntry = acc[memberId];
      currentEntry.monthlyTarget += monthlyAmount;
      currentEntry.quarterlyTarget += quarterlyAmount;
      currentEntry.achieved += achieved;
      
      return acc;
    }, {} as Record<string, any>);

    // Merge all members with their targets data
    const result = allMembers.map(member => {
      const targetData = targetsByMember[member.amId];
      if (targetData) {
        return {
          ...targetData,
          gap: targetData.quarterlyTarget - targetData.achieved,
          status: (targetData.quarterlyTarget - targetData.achieved) <= 0 ? 'On Track' : 'Behind'
        };
      }
      return member; // Member with no targets (all zeros)
    });

    // Sort by role hierarchy
    const roleOrder = { head: 0, manager: 1, account_manager: 2 };
    return result.sort((a, b) => {
      const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] || 3) - 
                         (roleOrder[b.role as keyof typeof roleOrder] || 3);
      return roleCompare !== 0 ? roleCompare : b.quarterlyTarget - a.quarterlyTarget;
    });
  }, [targets, accountManagers]);



  const pageTitle = profile?.role === 'head' ? 'Manager Target' : 'Sales Target';

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Department Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(departmentMetrics.target)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(departmentMetrics.achieved)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(departmentMetrics.gap)}</div>
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
                  <BarChart data={amPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={11}
                    />
                    <YAxis fontSize={12} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                <span className="text-3xl font-bold">{attainmentData[0]?.value || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
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
                  <TableCell colSpan={7} className="text-center">Loading targets...</TableCell>
                </TableRow>
              ) : amTableData.length > 0 ? (
                amTableData.map((row, index) => {
                  const roleLabel = row.role === 'manager' ? 'Manager' : 
                                   row.role === 'head' ? 'Head' : 
                                   'Account Manager';
                  const bgClass = row.role === 'head' ? 'bg-muted/50' : 
                                 row.role === 'manager' ? 'bg-muted/30' : '';
                  
                  return (
                    <TableRow key={row.amId || index} className={bgClass}>
                      <TableCell className="font-medium">{row.am}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(row.monthlyTarget)}</TableCell>
                      <TableCell>{formatCurrency(row.quarterlyTarget)}</TableCell>
                      <TableCell>{formatCurrency(row.achieved)}</TableCell>
                      <TableCell className={row.gap > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(Math.abs(row.gap))}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === 'On Track' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No team members found</TableCell>
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