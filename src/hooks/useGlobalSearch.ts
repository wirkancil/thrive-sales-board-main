import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  rid: string;
  rtype: string;
  title: string;
  owner_name: string;
  body: string;
  score: number;
  created_at: string;
}

export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('search_manager_data', { search_query: query });

      if (error) throw error;

      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
};