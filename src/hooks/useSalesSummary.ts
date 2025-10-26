import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export interface SalesSummaryMetrics {
  totalRevenue: number;
  dealsClosed: number;
  targetAchievement: number;
  averageDealSize: number;
  conversionRate: number;
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
    deals: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    deals: number;
  }>;
  pipelineByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
}

export const useSalesSummary = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  return useQuery({
    queryKey: ['sales-summary', user?.id, profile?.role, startDate, endDate],
    queryFn: async () => {
      if (!user || !profile) throw new Error('Not authenticated');

      // Build date filter
      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = `and created_at >= '${startDate.toISOString()}' and created_at <= '${endDate.toISOString()}'`;
      }

      // Get won opportunities based on role
      let query = supabase
        .from('opportunities')
        .select(`
          id,
          amount,
          currency,
          created_at,
          owner_id,
          user_profiles!opportunities_owner_id_fkey(full_name)
        `)
        .eq('is_won', true);

      if (profile.role === 'manager') {
        // Get team opportunities
        const { data: teamMembers } = await supabase
          .from('manager_team_members')
          .select('account_manager_id')
          .eq('manager_id', profile.id);

        const amIds = (teamMembers || []).map((m: any) => m.account_manager_id);
        let ownerUserIds: string[] = [];
        if (amIds.length > 0) {
          const { data: amProfiles } = await supabase
            .from('user_profiles')
            .select('user_id')
            .in('id', amIds);
          ownerUserIds = (amProfiles || []).map((p: any) => p.user_id).filter(Boolean);
        } else if (profile.department_id) {
          const { data: deptUsers } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('department_id', profile.department_id);
          ownerUserIds = (deptUsers || []).map((u: any) => u.user_id).filter(Boolean);
        }

        if (ownerUserIds.length > 0) {
          query = query.in('owner_id', ownerUserIds);
        }
      } else if (profile.role === 'head') {
        // Get all opportunities in entity - only if entity_id exists
        if (profile.entity_id) {
          const { data: entityMembers } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('entity_id', profile.entity_id);

          if (entityMembers && entityMembers.length > 0) {
            const entityIds = entityMembers.map(m => m.id);
            query = query.in('owner_id', entityIds);
          }
        } else {
          // If no entity_id, fallback to just the current user
          query = query.eq('owner_id', user.id);
        }
      }

      const { data: wonOpps, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalRevenue = wonOpps?.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;
      const dealsClosed = wonOpps?.length || 0;

      // Get targets for achievement calculation
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('amount')
        .eq('assigned_to', profile.id)
        .gte('period_end', new Date().toISOString().split('T')[0])
        .lte('period_start', new Date().toISOString().split('T')[0])
        .maybeSingle();

      const targetAchievement = targets?.amount ? (totalRevenue / targets.amount) * 100 : 0;
      const averageDealSize = dealsClosed > 0 ? totalRevenue / dealsClosed : 0;

      // Calculate top performers
      const performerMap = new Map<string, { name: string; revenue: number; deals: number }>();
      wonOpps?.forEach(opp => {
        const ownerId = opp.owner_id;
        const ownerName = (opp.user_profiles as any)?.full_name || 'Unknown';
        const existing = performerMap.get(ownerId) || { name: ownerName, revenue: 0, deals: 0 };
        existing.revenue += opp.amount || 0;
        existing.deals += 1;
        performerMap.set(ownerId, existing);
      });

      const topPerformers = Array.from(performerMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Revenue by month
      const monthMap = new Map<string, { revenue: number; deals: number }>();
      wonOpps?.forEach(opp => {
        const month = new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const existing = monthMap.get(month) || { revenue: 0, deals: 0 };
        existing.revenue += opp.amount || 0;
        existing.deals += 1;
        monthMap.set(month, existing);
      });

      const revenueByMonth = Array.from(monthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Get pipeline by stage
      const { data: pipelineData } = await supabase
        .from('opportunities')
        .select('stage, amount')
        .eq('status', 'open');

      const stageMap = new Map<string, { count: number; value: number }>();
      pipelineData?.forEach(opp => {
        const existing = stageMap.get(opp.stage) || { count: 0, value: 0 };
        existing.count += 1;
        existing.value += opp.amount || 0;
        stageMap.set(opp.stage, existing);
      });

      const pipelineByStage = Array.from(stageMap.entries())
        .map(([stage, data]) => ({ stage, ...data }));

      // Get total opportunities for conversion rate
      const { count: totalOpps } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const conversionRate = totalOpps ? (dealsClosed / totalOpps) * 100 : 0;

      return {
        totalRevenue,
        dealsClosed,
        targetAchievement,
        averageDealSize,
        conversionRate,
        topPerformers,
        revenueByMonth,
        pipelineByStage,
      } as SalesSummaryMetrics;
    },
    enabled: !!user && !!profile && ['manager', 'head', 'admin'].includes(profile.role),
  });
};
