import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StageMetric {
  id: string;
  owner_id: string;
  stage: string;
  stage_entered_at: string | null;
  stage_completed_at: string | null;
  default_due_days: number;
  effective_due_days: number;
  points: number;
  days_in_stage: number;
  is_overdue: boolean;
  owner_name: string;
}

export const useStageMetrics = (userId?: string) => {
  const [metrics, setMetrics] = useState<StageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      let query = supabase
        .from("opportunity_stage_metrics")
        .select("*");

      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMetrics(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOverdueCount = () => metrics.filter(m => m.is_overdue).length;
  
  const getAverageDaysInStage = () => {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.days_in_stage, 0);
    return Math.round(total / metrics.length);
  };

  const getTotalPoints = () => metrics.reduce((sum, m) => sum + m.points, 0);

  return {
    metrics,
    loading,
    refetch: fetchMetrics,
    getOverdueCount,
    getAverageDaysInStage,
    getTotalPoints,
  };
};
