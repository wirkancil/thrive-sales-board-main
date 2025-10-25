import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'account_manager' | 'manager' | 'head' | 'admin';
  department: string | null;
  created_at: string;
  preferences: any | null;
  division_id: string | null;
  department_id: string | null;
  team_id: string | null;
  is_active: boolean;
  // Phase 1 enhancements
  title_id: string | null;
  region_id: string | null;
  region_code: string | null;
  currency_code: string;
  locale: string;
  timezone: string;
  fiscal_calendar_id: string | null;
  external_id: string | null;
  tenant_id: string | null;
  user_status: 'active' | 'inactive' | 'resigned' | 'terminated' | 'leave';
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  updated_at: string | null;
  // Phase 1 hierarchy fields
  entity_id: string | null;
}

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleName, setTitleName] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);

  const fetchProfile = async (currentUser: User) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      // Jika tidak ada row, buat profil default
      if (error && (error as any).code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: currentUser.id,
            full_name: (currentUser as any)?.user_metadata?.full_name || currentUser.email || 'Unknown User',
            role: 'account_manager',
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setProfile(newProfile as any);
        setTitleName(null);
        setRegionName(null);
        return;
      }

      setProfile(data as any);
      
      // Fetch title and region names if available
      if (data?.title_id) {
        const { data: titleData } = await supabase
          .from('titles')
          .select('name')
          .eq('id', data.title_id)
          .single();
        setTitleName(titleData?.name || null);
      } else {
        setTitleName(null);
      }

      if (data?.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('name')
          .eq('id', data.region_id)
          .single();
        setRegionName(regionData?.name || null);
      } else {
        setRegionName(null);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as any);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchProfile(user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  // Helper functions for role checking
  const hasRole = (requiredRole: UserProfile['role']) => {
    return profile?.role === requiredRole;
  };

  const canAccessDivisionData = () => {
    return profile?.role === 'head' || profile?.role === 'manager' || profile?.role === 'admin';
  };

  const canAccessDepartmentData = () => {
    return profile?.role === 'manager' || profile?.role === 'admin';
  };

  const canManageRoles = () => {
    return profile?.role === 'manager' || profile?.role === 'admin';
  };

  // Phase 1 role helpers
  const isAdmin = () => profile?.role === 'admin';
  const isHead = () => profile?.role === 'head';  
  const isManager = () => profile?.role === 'manager';
  const isAccountManager = () => profile?.role === 'account_manager';

  // Enhanced display helper for role + title + region
  const getDisplayName = () => {
    if (!profile) return '';
    const parts = [];
    if (profile.full_name) parts.push(profile.full_name);
    return parts.join(' - ');
  };

  const getRoleDisplayName = () => {
    if (!profile) return '';
    const parts = [];
    
    // Add role display name
    const roleNames = {
      'admin': 'System Administrator',
      'head': 'Level Head', 
      'manager': 'Level Manager',
      'account_manager': 'Field Sales Staff'
    } as const;
    parts.push(roleNames[profile.role] || profile.role);
    
    // Add actual title name if available
    if (titleName) {
      parts.push(titleName);
    }
    
    // Add actual region name if available
    if (regionName) {
      parts.push(regionName);
    }
    
    return parts.join(' – ');
  };

  return {
    profile,
    loading: loading || authLoading,
    error,
    updateProfile,
    refetch: () => user && fetchProfile(user),
    // Helper functions
    hasRole,
    canAccessDivisionData,
    canAccessDepartmentData,
    canManageRoles,
    // Phase 1 helpers
    isAdmin,
    isHead,
    isManager,
    isAccountManager,
    getDisplayName,
    getRoleDisplayName,
  };
};