import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface AuditLog {
  id: string;
  entity_id: string | null;
  user_id: string | null;
  action_type: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  session_id: string | null;
  // Joined data
  user_name?: string;
  entity_name?: string;
}

export interface AuditLogFilters {
  actionType?: string;
  tableName?: string;
  userId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export const useAuditLogs = (filters?: AuditLogFilters) => {
  const { profile } = useProfile();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_log_v2')
        .select(`
          *,
          user_profiles!audit_log_v2_user_id_fkey(full_name),
          entities!audit_log_v2_entity_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Apply filters
      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      
      if (filters?.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to include joined information
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        user_name: log.user_profiles?.full_name || 'Unknown User',
        entity_name: log.entities?.name || 'No Entity'
      }));

      setAuditLogs(transformedData);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logAuditEvent = async (
    actionType: string,
    tableName: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        p_action_type: actionType,
        p_table_name: tableName,
        p_record_id: recordId || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_metadata: metadata || {}
      });

      if (error) throw error;
      
      // Refresh logs after creating new one
      await fetchAuditLogs();
    } catch (err: any) {
      console.error('Error logging audit event:', err);
      throw err;
    }
  };

  const getActivitySummary = () => {
    const summary = {
      totalActions: auditLogs.length,
      creates: auditLogs.filter(log => log.action_type === 'CREATE').length,
      updates: auditLogs.filter(log => log.action_type === 'UPDATE').length,
      deletes: auditLogs.filter(log => log.action_type === 'DELETE').length,
      recentActivity: auditLogs.slice(0, 10)
    };
    
    return summary;
  };

  const getTableActivity = () => {
    const tableActivity: Record<string, number> = {};
    auditLogs.forEach(log => {
      tableActivity[log.table_name] = (tableActivity[log.table_name] || 0) + 1;
    });
    
    return Object.entries(tableActivity)
      .sort(([,a], [,b]) => b - a)
      .map(([table, count]) => ({ table, count }));
  };

  const getUserActivity = () => {
    const userActivity: Record<string, { name: string; count: number }> = {};
    auditLogs.forEach(log => {
      const userId = log.user_id || 'system';
      const userName = log.user_name || 'System';
      
      if (!userActivity[userId]) {
        userActivity[userId] = { name: userName, count: 0 };
      }
      userActivity[userId].count++;
    });
    
    return Object.entries(userActivity)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([userId, data]) => ({ userId, ...data }));
  };

  useEffect(() => {
    // Only fetch if user has permission to view audit logs
    if (profile?.role === 'admin' || profile?.role === 'head') {
      fetchAuditLogs();
    }
  }, [profile, filters]);

  return {
    auditLogs,
    loading,
    error,
    logAuditEvent,
    getActivitySummary,
    getTableActivity,
    getUserActivity,
    refetch: fetchAuditLogs,
  };
};