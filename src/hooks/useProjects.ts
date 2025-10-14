import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Project {
  id: string;
  name: string;
  opportunity_id: string;
  po_number: string | null;
  po_date: string | null;
  po_amount: number | null;
  payment_type: 'CBD' | 'TOP' | 'Installments' | null;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  cbd_percentage: number | null;
  cbd_due_date: string | null;
  top_days: number | null;
  top_due_date: string | null;
  installments: any[] | null;
  notes: string | null;
  currency: string;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          opportunities(
            name,
            amount,
            customer_id,
            organizations!opportunities_customer_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (projectData: any) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create project');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update project');
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
  };
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          opportunities(
            name,
            amount,
            customer_id,
            owner_id,
            organizations!opportunities_customer_id_fkey(name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Fetch owner info separately
      if (data.opportunities?.owner_id) {
        const { data: ownerData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', data.opportunities.owner_id)
          .single();
        
        if (ownerData) {
          (data.opportunities as any).owner = ownerData;
        }
      }
      
      return data;
    },
    enabled: !!id,
  });
};
