import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DepartmentPerformanceOverviewProps {
  selectedPeriod?: string;
}

export function DepartmentPerformanceOverview({
  selectedPeriod = "Q1 2026"
}: DepartmentPerformanceOverviewProps) {
  
  // Mock data for account manager performance within department
  const accountManagerPerformanceData = useMemo(() => {
    return [
      { name: 'John Smith', target: 2500000000, achieved: 1800000000, gap: 700000000 },
      { name: 'Sarah Johnson', target: 2200000000, achieved: 1980000000, gap: 220000000 },
      { name: 'Mike Davis', target: 1800000000, achieved: 1620000000, gap: 180000000 },
      { name: 'Lisa Chen', target: 2000000000, achieved: 1700000000, gap: 300000000 },
      { name: 'Tom Wilson', target: 1500000000, achieved: 1350000000, gap: 150000000 },
      { name: 'Anna Garcia', target: 1900000000, achieved: 1710000000, gap: 190000000 }
    ];
  }, [selectedPeriod]);

  // Calculate overall department attainment
  const attainmentData = useMemo(() => {
    const totalTarget = accountManagerPerformanceData.reduce((sum, am) => sum + am.target, 0);
    const totalAchieved = accountManagerPerformanceData.reduce((sum, am) => sum + am.achieved, 0);
    const achievementRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    
    return [
      { name: 'Achieved', value: Math.round(achievementRate), fill: 'hsl(var(--primary))' },
      { name: 'Remaining', value: Math.round(100 - achievementRate), fill: 'hsl(var(--muted))' }
    ];
  }, [accountManagerPerformanceData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Department Performance
          </h2>
          <p className="text-muted-foreground">
            Track account manager performance within your department
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Manager Performance</CardTitle>
              <CardDescription>Target vs Achievement by Account Manager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountManagerPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="achieved" fill="hsl(var(--primary))" name="Achieved" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Overall Attainment</CardTitle>
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
    </div>
  );
}