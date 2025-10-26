import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
}

export const useManagerTeam = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!profile) return;

      try {
        setLoading(true);

        // Try explicit mapping via manager_team_members (manager_id references user_profiles.id)
        const { data: teamMap, error } = await supabase
          .from('manager_team_members')
          .select('account_manager_id')
          .eq('manager_id', profile.id);

        if (error) throw error;

        const amIds = (teamMap || []).map((m: any) => m.account_manager_id);

        if (amIds.length === 0) {
          // Fallback: derive team by division/department for manager-level visibility
          let fallbackQuery = supabase
            .from('user_profiles')
            .select('id, full_name, user_id')
            .eq('role', 'account_manager' as any)
            .eq('is_active', true);

          if (profile.department_id) {
            fallbackQuery = fallbackQuery.eq('department_id', profile.department_id);
          } else if (profile.division_id) {
            fallbackQuery = fallbackQuery.eq('division_id', profile.division_id);
          }

          const { data: fallbackProfiles, error: fError } = await fallbackQuery;
          if (fError) throw fError;

          const mappedFallback: TeamMember[] = (fallbackProfiles || [])
            .filter((p: any) => !!p.user_id)
            .map((p: any) => ({ id: p.id, user_id: p.user_id, full_name: p.full_name }));

          setTeamMembers(mappedFallback);
          return;
        }

        // Hydrate full_name and user_id from user_profiles for explicit mapping
        const { data: profiles, error: pError } = await supabase
          .from('user_profiles')
          .select('id, full_name, user_id')
          .in('id', amIds);

        if (pError) throw pError;

        const mappedMembers: TeamMember[] = (profiles || [])
          .filter((p: any) => !!p.user_id)
          .map((p: any) => ({ id: p.id, user_id: p.user_id, full_name: p.full_name }));

        setTeamMembers(mappedMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user, profile]);

  return { teamMembers, loading };
};