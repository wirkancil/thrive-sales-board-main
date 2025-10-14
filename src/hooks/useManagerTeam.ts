import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TeamMember {
  id: string;
  full_name: string;
}

export const useManagerTeam = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('manager_team_members')
          .select('account_manager_id, full_name')
          .eq('manager_id', user.id);

        if (error) throw error;

        const mappedMembers: TeamMember[] = (data || []).map(member => ({
          id: member.account_manager_id,
          full_name: member.full_name
        }));

        setTeamMembers(mappedMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user]);

  return { teamMembers, loading };
};