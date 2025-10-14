import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'account_manager' | 'head' | 'manager' | 'admin';
  department?: string;
  division_id?: string;
  department_id?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  status: 'open' | 'won' | 'lost' | 'cancelled';
  stage: string | null;
  forecast_category: string | null;
  next_step_title: string | null;
  next_step_due_date: string | null;
  is_closed: boolean;
  is_won: boolean;
  opp_stage: string | null;
  owner_id: string;
  customer_id: string;
  end_user_id: string | null;
  pipeline_id: string;
  stage_id: string;
  stage_name?: string;
  customer_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_from_activity_id?: string | null;
  last_activity_at?: string | null;
  // Backward compatibility with Deal interface
  company_name: string;
  contact_person: string | null;
  contact_email?: string | null;
  deal_value: number;
  notes?: string | null;
}

export interface SalesActivity {
  id: string;
  activity_time: string;
  activity_type: 'Call' | 'Email' | 'Meeting';
  customer_name: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface FilterOptions {
  selectedRep?: string;
  selectedManager?: string;
  dateRange?: string;
}

export const useRoleBasedData = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [availableReps, setAvailableReps] = useState<{ id: string; name: string }[]>([]);
  const [availableHeads, setAvailableHeads] = useState<{ id: string; name: string }[]>([]);
  const [availableManagers, setAvailableManagers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setUserProfile(data as UserProfile);
        } else {
          // Create default profile if doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              full_name: user.email || 'Unknown User',
              role: 'account_manager'
            })
            .select()
            .single();

          if (createError) throw createError;
          setUserProfile(newProfile as UserProfile);
        }
        } catch (err) {
          // Error handling would be displayed in UI
        setError('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch opportunities based on user role
  const fetchOpportunities = async (filters?: FilterOptions) => {
    if (!user || !userProfile) return;

    try {
      // First get opportunity IDs that are already in pipeline_items
      const { data: pipelineItems } = await supabase
        .from('pipeline_items')
        .select('opportunity_id');
      
      const pipelineOpportunityIds = pipelineItems?.map(item => item.opportunity_id) || [];

      let query = supabase
        .from('opportunities')
        .select(`
          *,
          pipeline_stages!stage_id (
            name
          )
        `);

      // Exclude opportunities that are already in pipeline_items
      if (pipelineOpportunityIds.length > 0) {
        query = query.not('id', 'in', `(${pipelineOpportunityIds.join(',')})`);
      }

      // Apply role-based filtering with proper hierarchy (using existing DB fields for now)
      if (userProfile.role === 'account_manager') {
        query = query.eq('owner_id', user.id);
      } else if (userProfile.role === 'head' && userProfile.division_id) {
        // Heads see opportunities from users in their division
        const { data: divisionUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('division_id', userProfile.division_id);
        
        if (divisionUsers && divisionUsers.length > 0) {
          const userIds = divisionUsers.map(u => u.id);
          query = query.in('owner_id', userIds);
        }
      } else if (userProfile.role === 'manager' && userProfile.department_id) {
        // Managers see opportunities from users in their department
        const { data: deptUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('department_id', userProfile.department_id);
        
        if (deptUsers && deptUsers.length > 0) {
          const userIds = deptUsers.map(u => u.id);
          query = query.in('owner_id', userIds);
        }
      }
      // Admins see all opportunities (no filter applied)

      // Apply additional filters
      if (filters?.selectedRep && userProfile.role !== 'account_manager') {
        query = query.eq('owner_id', filters.selectedRep);
      }

      // Apply manager filter for managers (using existing DB fields - division_id represents manager level)
      if (filters?.selectedManager && filters.selectedManager !== 'all' && userProfile.role === 'manager') {
        const { data: managerUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('division_id', filters.selectedManager);
        
        if (managerUsers && managerUsers.length > 0) {
          const userIds = managerUsers.map(u => u.id);
          query = query.in('owner_id', userIds);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map and type the data properly with new database fields
      const mappedOpportunities: Opportunity[] = (data || []).map((opp: any) => ({
        id: opp.id,
        name: opp.name,
        description: opp.description,
        amount: opp.amount,
        currency: opp.currency || 'USD',
        probability: opp.probability || 0,
        expected_close_date: opp.expected_close_date,
        status: opp.status,
        stage: opp.pipeline_stages?.name || 'Prospecting',
        forecast_category: opp.forecast_category,
        next_step_title: opp.next_step_title,
        next_step_due_date: opp.next_step_due_date,
        is_closed: opp.is_closed || false,
        is_won: opp.is_won || false,
        opp_stage: opp.opp_stage,
        owner_id: opp.owner_id,
        customer_id: opp.customer_id,
        end_user_id: opp.end_user_id,
        pipeline_id: opp.pipeline_id,
        stage_id: opp.stage_id,
        stage_name: opp.stage_name,
        customer_name: opp.customer_name,
        created_by: opp.created_by,
        created_at: opp.created_at,
        updated_at: opp.updated_at,
        created_from_activity_id: opp.created_from_activity_id,
        // Backward compatibility mapping
        company_name: opp.customer_name || opp.name,
        contact_person: null, // This data is not in opportunities table
        contact_email: null,
        deal_value: opp.amount || 0,
        notes: opp.description
      }));
      
      setOpportunities(mappedOpportunities);
      } catch (err) {
        // Error handling would be displayed in UI
      setError('Failed to load opportunities');
    }
  };

  // Fetch activities based on user role
  const fetchActivities = async (filters?: FilterOptions) => {
    if (!user || !userProfile) return;

    try {
      let query = supabase.from('sales_activity').select('*');

      // Apply role-based filtering with proper hierarchy (using existing DB fields for now)
      if (userProfile.role === 'account_manager') {
        query = query.eq('user_id', user.id);
      } else if (userProfile.role === 'head' && userProfile.division_id) {
        // Heads see activities from users in their division
        const { data: divisionUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('division_id', userProfile.division_id);
        
        if (divisionUsers && divisionUsers.length > 0) {
          const userIds = divisionUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      } else if (userProfile.role === 'manager' && userProfile.department_id) {
        // Managers see activities from users in their department
        const { data: deptUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('department_id', userProfile.department_id);
        
        if (deptUsers && deptUsers.length > 0) {
          const userIds = deptUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }
      // Admins see all activities (no filter applied)

      // Apply additional filters
      if (filters?.selectedRep && userProfile.role !== 'account_manager') {
        query = query.eq('user_id', filters.selectedRep);
      }

      // Apply manager filter for managers (using existing DB fields - division_id represents manager level)
      if (filters?.selectedManager && filters.selectedManager !== 'all' && userProfile.role === 'manager') {
        const { data: managerUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('division_id', filters.selectedManager);
        
        if (managerUsers && managerUsers.length > 0) {
          const userIds = managerUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map and type the data properly
      const mappedActivities: SalesActivity[] = (data || []).map((activity: any) => ({
        id: activity.id,
        activity_time: activity.activity_time,
        activity_type: activity.activity_type as SalesActivity['activity_type'],
        customer_name: activity.customer_name,
        notes: activity.notes,
        user_id: activity.user_id,
        created_at: activity.created_at
      }));
      
      setActivities(mappedActivities);
      } catch (err) {
        // Error handling would be displayed in UI
      setError('Failed to load activities');
    }
  };

  // Fetch available sales reps with proper division-based filtering
  const fetchAvailableReps = async () => {
    if (!userProfile || userProfile.role === 'account_manager') return;

    try {
      let query = supabase.from('user_profiles').select('id, full_name, role, division_id, department_id');

      if (userProfile.role === 'head' && userProfile.division_id) {
        // Heads see users in their division
        query = query.eq('division_id', userProfile.division_id);
      } else if (userProfile.role === 'manager' && userProfile.department_id) {
        // Managers see users in their department
        query = query.eq('department_id', userProfile.department_id);
      }
      // Admins see all users (no filter applied)

      const { data, error } = await query.order('full_name');

      if (error) throw error;
      setAvailableReps(data?.map(rep => ({ id: rep.id, name: rep.full_name })) || []);
    } catch (err) {
      console.error('Error fetching available reps:', err);
      setAvailableReps([]);
    }
  };

  // Fetch available managers - using mock data until DB structure is updated
  const fetchAvailableManagers = async () => {
    if (!userProfile) return;

    try {
      // Using divisions table as the source for managers until schema is updated
      let query = supabase.from('divisions').select('id, name');
      const { data, error } = await query.order('name');

      if (error) throw error;
      setAvailableManagers(data?.map(mgr => ({ id: mgr.id, name: mgr.name })) || []);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setAvailableManagers([]);
    }
  };

  // Load data when profile is available
  useEffect(() => {
    if (userProfile) {
      Promise.all([
        fetchOpportunities(),
        fetchActivities(),
        fetchAvailableReps(),
        fetchAvailableManagers()
      ]).finally(() => setLoading(false));
    }
  }, [userProfile]);

  // Listen for pipeline item additions to refresh opportunities
  useEffect(() => {
    const handlePipelineItemAdded = () => {
      if (userProfile) {
        fetchOpportunities();
      }
    };

    window.addEventListener('pipelineItemAdded', handlePipelineItemAdded);
    return () => window.removeEventListener('pipelineItemAdded', handlePipelineItemAdded);
  }, [userProfile]);

  // Refresh data with filters
  const refreshData = async (filters?: FilterOptions) => {
    if (!userProfile) return;
    
    setLoading(true);
    await Promise.all([
      fetchOpportunities(filters),
      fetchActivities(filters)
    ]);
    setLoading(false);
  };

  // Calculate metrics
  const metrics = {
    totalDeals: opportunities.length,
    totalValue: opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0),
    wonDeals: opportunities.filter(opp => opp.status === 'won').length,
    activeDeals: opportunities.filter(opp => opp.status === 'open').length,
    conversionRate: opportunities.length > 0 ? Math.round((opportunities.filter(opp => opp.status === 'won').length / opportunities.length) * 100) : 0,
    totalActivities: activities.length,
    recentActivities: activities.slice(0, 10)
  };

  return {
    userProfile,
    opportunities,
    deals: opportunities, // Keep backward compatibility
    activities,
    availableReps,
    availableHeads,
    availableManagers,
    metrics,
    loading,
    error,
    refreshData
  };
};