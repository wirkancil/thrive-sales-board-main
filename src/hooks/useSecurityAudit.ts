import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { Database } from '@/integrations/supabase/types';

type SecurityAuditLog = Database['public']['Tables']['security_audit_log']['Row'];

export const useSecurityAudit = () => {
  const { profile } = useProfile();
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async (limit = 100) => {
    // Only admins can view audit logs
    if (!profile || profile.role !== 'admin') {
      setAuditLogs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setAuditLogs(data as SecurityAuditLog[] || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldValues?: Database['public']['Tables']['security_audit_log']['Row']['old_values'],
    newValues?: Database['public']['Tables']['security_audit_log']['Row']['new_values']
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
        });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error logging security event:', err);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [profile]);

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogs,
    logSecurityEvent,
    canViewAuditLogs: profile?.role === 'admin',
  };
};