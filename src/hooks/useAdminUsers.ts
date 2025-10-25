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
    console.log('🔧 updateUserProfile called with:', { userId, role, divisionId, departmentId });
    
    try {
      console.log('🔍 Checking current user profile...');
      const { data: currentProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error fetching current profile:', profileError);
        return { success: false, error: profileError.message };
      }

      if (profileError && profileError.code === 'PGRST116') {
        console.log('📝 User profile not found, will be created by RPC function');
      } else {
        console.log('📄 Current profile:', currentProfile);
      }

      console.log('🚀 Calling admin_update_profile RPC...');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_profile', {
        p_id: userId,
        p_role: role,
        p_division: divisionId || null,
        p_department: departmentId || null
      });

      console.log('📊 RPC Result:', { rpcResult, rpcError });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        return { success: false, error: rpcError.message };
      }

      console.log('✅ RPC call successful, result:', rpcResult);

      // If currentProfile is null (user didn't exist), skip the comparison check
      if (!currentProfile) {
        console.log('📝 New user profile created successfully');
        
        // Optimistically update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role, division_id: divisionId, department_id: departmentId }
              : user
          )
        );
        
        return { success: true };
      }

      // Check if there are any mismatches that require direct update
      const needsDirectUpdate = 
        (role !== currentProfile.role) ||
        (divisionId && divisionId !== currentProfile.division_id) ||
        (departmentId && departmentId !== currentProfile.department_id);

      console.log('🔍 Needs direct update?', needsDirectUpdate);

      if (needsDirectUpdate) {
        console.log('🔄 Performing direct update to user_profiles...');
        const updateData: any = { role };
        if (divisionId) updateData.division_id = divisionId;
        if (departmentId) updateData.department_id = departmentId;

        console.log('📝 Update data:', updateData);

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Direct update error:', updateError);
          return { success: false, error: updateError.message };
        }

        console.log('✅ Direct update successful');
      }

      // Optimistically update local state
      console.log('🔄 Updating local state optimistically...');
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                role: role as any,
                division_id: divisionId || user.division_id,
                department_id: departmentId || user.department_id
              }
            : user
        )
      );

      console.log('🔄 Calling refetch to sync with database...');
      await refetch();
      
      console.log('🎉 updateUserProfile completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('💥 Unexpected error in updateUserProfile:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await (supabase as any).rpc('admin_delete_user', { p_id: userId });
    if (!error) refetch();
    return { success: !error, error };
  };

  return { users, loading, refetch, updateUserProfile, deleteUser };
}