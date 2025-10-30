import { useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentPipelineOverview } from "@/components/dashboard/DepartmentPipelineOverview";
import { DepartmentActivitiesLog } from "@/components/dashboard/DepartmentActivitiesLog";
import { DepartmentReportsSummary } from "@/components/dashboard/DepartmentReportsSummary";
import { DepartmentCalendarAggregator } from "@/components/dashboard/DepartmentCalendarAggregator";
import { DepartmentAdvancedAnalytics } from "@/components/dashboard/DepartmentAdvancedAnalytics";
import { DepartmentPerformanceOverview } from "@/components/dashboard/DepartmentPerformanceOverview";
import { CalendarDays, Filter, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useProfile } from "@/hooks/useProfile";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";

export default function OperationalDashboard() {
  const { profile } = useProfile();
  const { availableReps, loading: dataLoading } = useRoleBasedData();
  const [selectedAccountManager, setSelectedAccountManager] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q1 2026");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Build options from real data with an "all" option
  const amOptions = [{ id: "all", name: "All Account Managers" }, ...availableReps];

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
        <div className="flex flex-col space-y-4">
          {/* Title and Role */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <DashboardHeader role="manager" />
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

          {/* Global Filters */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Account Manager</label>
                  <Select value={selectedAccountManager} onValueChange={setSelectedAccountManager}>
                    <SelectTrigger>
                      <SelectValue placeholder={dataLoading ? "Loading..." : "Select account manager"} />
                    </SelectTrigger>
                    <SelectContent>
                      {amOptions
                        .filter(am => am.id && am.id.trim() !== '' && am.name && am.name.trim() !== '')
                        .map((am) => (
                          <SelectItem key={am.id} value={am.id}>
                            {am.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Custom Range
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="space-y-8">
        {/* Period Selector */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Period:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                <SelectItem value="Q2 2025">Q2 2025</SelectItem>
                <SelectItem value="Q3 2025">Q3 2025</SelectItem>
                <SelectItem value="Q4 2025">Q4 2025</SelectItem>
                <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                <SelectItem value="Q4 2026">Q4 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Team Performance Section */}
        <DepartmentPerformanceOverview 
          selectedPeriod={selectedPeriod}
        />
        
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DepartmentPipelineOverview 
              selectedDivision="operational" 
              selectedRep={selectedAccountManager}
              dateRange={dateRange} 
            />
            <DepartmentReportsSummary 
              selectedDivision="operational" 
              selectedRep={selectedAccountManager}
              dateRange={dateRange} 
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <DepartmentActivitiesLog 
              selectedDivision="operational" 
              selectedRep={selectedAccountManager}
              dateRange={dateRange} 
            />
            <DepartmentCalendarAggregator 
              selectedDivision="operational" 
              selectedRep={selectedAccountManager}
              dateRange={dateRange} 
            />
          </div>
        </div>

        <DepartmentAdvancedAnalytics 
          selectedDivision="operational" 
          selectedRep={selectedAccountManager}
          dateRange={dateRange} 
        />
      </div>
    </div>
  );
}