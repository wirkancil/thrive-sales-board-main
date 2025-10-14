import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminUsers(query: string, roleFilter: string) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const p_query = query?.trim() ? query.trim() : null;

      // Map UI filter values -> DB roles (updated for new role structure)
      const roleMap: Record<string, string | null> = {
        all: null,
        admin: 'admin',
        head: 'head',
        manager: 'manager',
        account_manager: 'account_manager',
        pending: 'pending'
      };
      const p_role = roleMap[roleFilter] ?? null;

      const { data, error } = await supabase.rpc('get_users_with_profiles', {
        p_query,
        p_role,
      });

      if (!alive) return;
      if (error) {
        console.error('get_users_with_profiles error', error);
        setUsers([]);
      } else {
        // Map the data to include backward compatibility and handle null values
        const mappedUsers = (data ?? []).map((user: any) => ({
          ...user,
          // Handle role as text (pending users) or enum
          role: user.role || 'pending'
        }));
        setUsers(mappedUsers);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [query, roleFilter, tick]);

  const refetch = () => setTick(x => x + 1);

  const updateUserProfile = async (
    userId: string,
    role: string,
    divisionId?: string | null,
    departmentId?: string | null
  ) => {
    const { error } = await supabase.rpc('admin_update_profile', {
      p_id: userId,
      p_role: role,
      p_division: divisionId ?? null,
      p_department: departmentId ?? null,
      p_team: null  // Explicitly pass null to use the 5-parameter version
    });
    if (!error) refetch();
    return { success: !error, error };
  };

  return { users, loading, refetch, updateUserProfile };
}