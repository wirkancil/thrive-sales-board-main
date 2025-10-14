import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_by: string | null;
  updated_at: string;
}

export interface EntityModeSettings {
  mode: 'single' | 'multi';
}

export interface CurrencyModeSettings {
  mode: 'single' | 'dual';
  home_currency: string;
  local_currency?: string;
}

export interface DashboardDisplaySettings {
  showTitleAndRegion: boolean;
}

export const useSystemSettings = () => {
  const { profile } = useProfile();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!profile?.role || profile.role !== 'admin') {
      throw new Error('Only admins can update system settings');
    }

    try {
      // First try to update existing setting
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_by: profile.id
        })
        .eq('setting_key', key)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      // If no rows were updated, insert new setting
      if (!data) {
        const { data: insertData, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            setting_key: key,
            setting_value: value,
            updated_by: profile.id
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
      }
      
      await fetchSettings();
      return { data: data || null, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || null;
  };

  const getEntityMode = (): EntityModeSettings => {
    return getSetting('entity_mode') || { mode: 'single' };
  };

  const getCurrencyMode = (): CurrencyModeSettings => {
    return getSetting('currency_mode') || { mode: 'single', home_currency: 'IDR' };
  };

  const getDashboardDisplay = (): DashboardDisplaySettings => {
    return getSetting('dashboard_display') || { showTitleAndRegion: false };
  };

  const setEntityMode = async (mode: 'single' | 'multi') => {
    return updateSetting('entity_mode', { mode });
  };

  const setCurrencyMode = async (mode: 'single' | 'dual', home_currency: string, local_currency?: string) => {
    const value: CurrencyModeSettings = { mode, home_currency };
    if (mode === 'dual' && local_currency) {
      value.local_currency = local_currency;
    }
    return updateSetting('currency_mode', value);
  };

  const setDashboardDisplay = async (showTitleAndRegion: boolean) => {
    const value: DashboardDisplaySettings = { showTitleAndRegion };
    return updateSetting('dashboard_display', value);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    getSetting,
    getEntityMode,
    getCurrencyMode,
    getDashboardDisplay,
    setEntityMode,
    setCurrencyMode,
    setDashboardDisplay,
    updateSetting,
    refetch: fetchSettings,
  };
};