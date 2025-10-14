import { useState } from "react";
import { useRoleBasedData, FilterOptions } from "@/hooks/useRoleBasedData";
import { RoleBadge } from "@/components/RoleBadge";
import { RoleBasedFilters } from "@/components/RoleBasedFilters";
import { SalesReporting } from "@/components/dashboard/SalesReporting";
import { SalesActivity } from "@/components/dashboard/SalesActivity";
import { SalesPipeline } from "@/components/dashboard/SalesPipeline";
import { MeetingCalendar } from "@/components/dashboard/MeetingCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const {
    userProfile,
    deals,
    activities,
    availableReps,
    availableHeads,
    metrics,
    loading,
    error,
    refreshData
  } = useRoleBasedData();

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    refreshData(updatedFilters);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Role Badge */}
      <div className="flex items-center justify-between">
        <DashboardHeader role={userProfile?.role || 'account_manager'} />
      </div>

      {/* Role-based Filters */}
      {userProfile && (
        <RoleBasedFilters
          userRole={userProfile.role}
          availableReps={availableReps}
          availableHeads={availableHeads}
          selectedRep={filters.selectedRep}
          selectedHead={filters.selectedManager}
          onRepChange={(repId) => handleFilterChange({ selectedRep: repId === 'all' ? undefined : repId })}
          onHeadChange={(headId) => handleFilterChange({ selectedManager: headId === 'all' ? undefined : headId })}
          onRefresh={() => refreshData(filters)}
          loading={loading}
        />
      )}

      {/* Overview Content */}
      <div className="space-y-6">
        <SalesReporting deals={deals} activities={activities} metrics={metrics} />
        <SalesPipeline deals={deals} userProfile={userProfile} />
      </div>

      {/* Activities Section */}
      <section id="activities" className="scroll-mt-6">
        <div className="border-t border-border pt-8">
          <h2 className="text-2xl font-bold mb-4">Activities</h2>
          <p className="text-muted-foreground mb-6">
            Track your sales activities and recent interactions
          </p>
          <SalesActivity activities={activities} userProfile={userProfile} />
        </div>
      </section>

      {/* Calendar Section */}
      <section id="calendar" className="scroll-mt-6">
        <div className="border-t border-border pt-8">
          <h2 className="text-2xl font-bold mb-4">Calendar</h2>
          <p className="text-muted-foreground mb-6">
            Manage your meetings and upcoming appointments
          </p>
          <MeetingCalendar />
        </div>
      </section>
    </div>
  );
}