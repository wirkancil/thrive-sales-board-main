import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface EntityScopedOpportunity {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  owner_id: string;
  customer_id: string;
  created_at: string;
}

export interface EntityScopedTarget {
  id: string;
  assigned_to: string;
  amount: number;
  period_start: string;
  period_end: string;
  measure: string;
}

export const useEntityScopedData = () => {
  const { profile } = useProfile();
  const [opportunities, setOpportunities] = useState<EntityScopedOpportunity[]>([]);
  const [targets, setTargets] = useState<EntityScopedTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntityScopedOpportunities = async () => {
    try {
      const { data, error } = await supabase.rpc('get_entity_scoped_opportunities');
      
      if (error) throw error;
      setOpportunities(data || []);
    } catch (err: any) {
      console.error('Error fetching entity-scoped opportunities:', err);
      setError(err.message);
    }
  };

  const fetchEntityScopedTargets = async () => {
    try {
      const { data, error } = await supabase.rpc('get_entity_scoped_targets');
      
      if (error) throw error;
      setTargets(data || []);
    } catch (err: any) {
      console.error('Error fetching entity-scoped targets:', err);
      setError(err.message);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchEntityScopedOpportunities(),
        fetchEntityScopedTargets()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOpportunityStats = () => {
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const stageBreakdown: Record<string, number> = {};
    
    opportunities.forEach(opp => {
      stageBreakdown[opp.stage] = (stageBreakdown[opp.stage] || 0) + 1;
    });

    return {
      total: opportunities.length,
      totalValue,
      stageBreakdown: Object.entries(stageBreakdown).map(([stage, count]) => ({
        stage,
        count
      }))
    };
  };

  const getTargetStats = () => {
    const totalTargetValue = targets.reduce((sum, target) => sum + target.amount, 0);
    const currentPeriodTargets = targets.filter(target => {
      const now = new Date();
      const start = new Date(target.period_start);
      const end = new Date(target.period_end);
      return start <= now && now <= end;
    });

    return {
      total: targets.length,
      totalValue: totalTargetValue,
      currentPeriod: currentPeriodTargets.length,
      currentPeriodValue: currentPeriodTargets.reduce((sum, target) => sum + target.amount, 0)
    };
  };

  const getEntityScope = () => {
    if (!profile) return 'loading';
    
    switch (profile.role) {
      case 'admin':
        return 'global';
      case 'head':
        return 'entity';
      case 'manager':
        return 'team';
      case 'account_manager':
        return 'individual';
      default:
        return 'none';
    }
  };

  useEffect(() => {
    if (profile) {
      fetchAllData();
    }
  }, [profile]);

  return {
    opportunities,
    targets,
    loading,
    error,
    getOpportunityStats,
    getTargetStats,
    getEntityScope,
    refetch: fetchAllData,
  };
};