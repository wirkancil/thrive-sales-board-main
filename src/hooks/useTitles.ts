import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Title {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export const useTitles = () => {
  const { isAdmin } = useProfile();
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTitles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('name');

      if (error) throw error;
      setTitles(data || []);
    } catch (err: any) {
      console.error('Error fetching titles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTitle = async (name: string) => {
    if (!isAdmin()) {
      throw new Error('Only admins can create titles');
    }

    try {
      const { data, error } = await supabase
        .from('titles')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      await fetchTitles(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateTitle = async (id: string, updates: { name?: string; is_active?: boolean }) => {
    if (!isAdmin()) {
      throw new Error('Only admins can update titles');
    }

    try {
      const { data, error } = await supabase
        .from('titles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchTitles(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteTitle = async (id: string) => {
    if (!isAdmin()) {
      throw new Error('Only admins can delete titles');
    }

    try {
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTitles(); // Refresh list
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  return {
    titles,
    loading,
    error,
    createTitle,
    updateTitle,
    deleteTitle,
    refetch: fetchTitles,
  };
};