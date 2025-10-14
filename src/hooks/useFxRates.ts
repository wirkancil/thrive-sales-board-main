import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface FxRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
}

export const useFxRates = () => {
  const { profile } = useProfile();
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFxRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .order('from_currency');

      if (error) throw error;
      setFxRates(data || []);
    } catch (err: any) {
      console.error('Error fetching FX rates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createFxRate = async (
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    rateDate?: string
  ) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can create FX rates');
    }

    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .insert({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate,
          rate_date: rateDate || new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      await fetchFxRates();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating FX rate:', err);
      return { data: null, error: err.message };
    }
  };

  const updateFxRate = async (
    id: string,
    updates: {
      rate?: number;
      rate_date?: string;
      is_active?: boolean;
    }
  ) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can update FX rates');
    }

    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchFxRates();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating FX rate:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteFxRate = async (id: string) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can delete FX rates');
    }

    try {
      const { error } = await supabase
        .from('fx_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchFxRates();
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting FX rate:', err);
      return { error: err.message };
    }
  };

  const getLatestRate = (fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return 1;
    
    const rate = fxRates.find(
      (r) =>
        r.from_currency === fromCurrency &&
        r.to_currency === toCurrency &&
        r.is_active
    );
    
    if (rate) return rate.rate;
    
    // Try inverse rate
    const inverseRate = fxRates.find(
      (r) =>
        r.from_currency === toCurrency &&
        r.to_currency === fromCurrency &&
        r.is_active
    );
    
    return inverseRate ? 1 / inverseRate.rate : null;
  };

  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ) => {
    const rate = getLatestRate(fromCurrency, toCurrency);
    return rate ? amount * rate : null;
  };

  useEffect(() => {
    fetchFxRates();
  }, []);

  return {
    fxRates,
    loading,
    error,
    createFxRate,
    updateFxRate,
    deleteFxRate,
    getLatestRate,
    convertAmount,
    refetch: fetchFxRates,
  };
};