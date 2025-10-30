import React from 'react';
import { RoleBadge } from '@/components/RoleBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { AccountOverview } from '@/components/dashboard/AccountOverview';
import { MyPipeline } from '@/components/dashboard/MyPipeline';
import { MyActivities } from '@/components/dashboard/MyActivities';
import { MyCalendar } from '@/components/dashboard/MyCalendar';

const AccountManagerDashboard: React.FC = () => {
  const { profile } = useProfile();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Your personal account management performance and activities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RoleBadge role="account_manager" />
        </div>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {profile?.full_name || 'Account Manager'}!</CardTitle>  
          <CardDescription>
            Here's your personal account management overview and recent activities.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Dashboard Grid */}
      <div className="space-y-6">
        {/* Account Overview - Full Width */}
        <AccountOverview />

        {/* Pipeline and Activities Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <MyPipeline />
          <MyActivities />
        </div>

        {/* Calendar - Full Width or in row */}
        <MyCalendar />
      </div>
    </div>
  );
};

export default AccountManagerDashboard;