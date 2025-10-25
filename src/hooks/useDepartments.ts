import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Department {
  id: string;
  name: string;
  division_id: string | null;
  created_at: string;
}

export const useDepartments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (name: string, division_id: string | null) => {
    const { error } = await supabase
      .from('departments')
      .insert({ name, division_id });
    if (error) throw error;
    await fetchDepartments();
  };

  const updateDepartment = async (id: string, updates: Partial<Pick<Department, 'name' | 'division_id'>>) => {
    const { error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    await fetchDepartments();
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchDepartments();
  };

  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user]);

  return {
    departments,
    loading,
    error,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
};