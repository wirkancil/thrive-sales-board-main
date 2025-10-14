import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Entity {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useEntities = () => {
  const { profile } = useProfile();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('name');

      if (error) throw error;
      setEntities(data || []);
    } catch (err: any) {
      console.error('Error fetching entities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEntity = async (name: string, code?: string) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can create entities');
    }

    try {
      const { data, error } = await supabase
        .from('entities')
        .insert({
          name,
          code: code || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      await fetchEntities();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating entity:', err);
      return { data: null, error: err.message };
    }
  };

  const updateEntity = async (id: string, updates: { name?: string; code?: string; is_active?: boolean }) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can update entities');
    }

    try {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchEntities();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating entity:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteEntity = async (id: string) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can delete entities');
    }

    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchEntities();
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting entity:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  return {
    entities,
    loading,
    error,
    createEntity,
    updateEntity,
    deleteEntity,
    refetch: fetchEntities,
  };
};