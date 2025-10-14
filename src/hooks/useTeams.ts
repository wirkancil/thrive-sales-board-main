import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  department_id: string;
  created_at: string;
}

export const useTeams = (departmentId?: string) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async (deptId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (deptId) {
        query = query.eq('department_id', deptId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setTeams(data || []);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(departmentId);
  }, [departmentId]);

  return {
    teams,
    loading,
    error,
    refetch: () => fetchTeams(departmentId),
  };
};