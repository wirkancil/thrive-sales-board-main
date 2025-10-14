import { useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamPipelineOverview } from "@/components/dashboard/TeamPipelineOverview";
import { TeamActivitiesSummary } from "@/components/dashboard/TeamActivitiesSummary";
import { TeamReportsPreview } from "@/components/dashboard/TeamReportsPreview";
import { TeamCalendarView } from "@/components/dashboard/TeamCalendarView";
import { TeamAnalyticsOverview } from "@/components/dashboard/TeamAnalyticsOverview";
import { CalendarDays, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useProfile } from "@/hooks/useProfile";

export default function StrategicDashboard() {
  const { profile } = useProfile();
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q1 2026");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock manager data - in real app, this would come from API based on head level
  const managers = [
    { id: "all", name: "All Managers" },
    { id: "sales", name: "Sales Manager" },
    { id: "marketing", name: "Marketing Manager" },
    { id: "operations", name: "Operations Manager" },
    { id: "support", name: "Customer Support Manager" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DashboardHeader role="head" />
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

      {/* Filters Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Manager</label>
          <Select value={selectedManager} onValueChange={setSelectedManager}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Date Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[150px]">
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Primary Content */}
        <div className="xl:col-span-2 space-y-6">
          <TeamPipelineOverview selectedRep={selectedManager} dateRange={dateRange} />
          <TeamActivitiesSummary selectedRep={selectedManager} dateRange={dateRange} />
          <TeamAnalyticsOverview selectedRep={selectedManager} dateRange={dateRange} />
        </div>

        {/* Right Column - Secondary Content */}
        <div className="space-y-6">
          <TeamReportsPreview selectedRep={selectedManager} dateRange={dateRange} />
          <TeamCalendarView selectedRep={selectedManager} dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
}