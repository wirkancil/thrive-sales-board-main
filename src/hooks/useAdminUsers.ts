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
        staff: 'staff',
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
          role: user.role ?? 'pending'
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
    divisionId?: string,
    departmentId?: string
  ) => {
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_profile', {
        p_id: userId, // accepts profile_id or user_id (patched in SQL)
        p_role: role,
        p_division: divisionId || null,
        p_department: departmentId || null
      });


      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        return { success: false, error: rpcError.message };
      }


      // Optimistically update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                role: role as any,
                division_id: divisionId ?? user.division_id,
                department_id: departmentId ?? user.department_id
              }
            : user
        )
      );

      await refetch();
      
      return { success: true };
    } catch (error: any) {
      console.error('💥 Unexpected error in updateUserProfile:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_delete_user', { p_id: userId });
      
      if (error) {
        console.error('RPC error:', error);
        return { success: false, error: error.message };
      }

      // RPC returns jsonb with {success, error?, message?}
      if (data?.success === false) {
        console.error('Delete failed:', data.error);
        return { success: false, error: data.error };
      }

      // Success - refetch user list
      refetch();
      return { success: true, message: data?.message };
    } catch (err: any) {
      console.error('Unexpected error:', err);
      return { success: false, error: err.message };
    }
  };

  return { users, loading, refetch, updateUserProfile, deleteUser };
}