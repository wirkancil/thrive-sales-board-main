import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Region {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export const useRegions = () => {
  const { isAdmin } = useProfile();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (error) throw error;
      setRegions(data || []);
    } catch (err: any) {
      console.error('Error fetching regions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRegion = async (name: string, code: string) => {
    if (!isAdmin()) {
      throw new Error('Only admins can create regions');
    }

    try {
      const { data, error } = await supabase
        .from('regions')
        .insert({ name, code })
        .select()
        .single();

      if (error) throw error;
      await fetchRegions(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateRegion = async (id: string, updates: { name?: string; code?: string; is_active?: boolean }) => {
    if (!isAdmin()) {
      throw new Error('Only admins can update regions');
    }

    try {
      const { data, error } = await supabase
        .from('regions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchRegions(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteRegion = async (id: string) => {
    if (!isAdmin()) {
      throw new Error('Only admins can delete regions');
    }

    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchRegions(); // Refresh list
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  return {
    regions,
    loading,
    error,
    createRegion,
    updateRegion,
    deleteRegion,
    refetch: fetchRegions,
  };
};