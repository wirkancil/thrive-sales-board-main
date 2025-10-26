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
  user_role: string | null;
  // Joined data from view
  user_name: string;
  entity_name: string | null;
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

export interface UserActivity {
  userId: string;
  name: string;
  count: number;
  role: string | null;
}

export const useAuditLogs = (filters?: AuditLogFilters, pageSize: number = 5) => {
  const { profile } = useProfile();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditLogs = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('v_audit_log_complete')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

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

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to include joined information
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        action_type: String(log.action_type).toUpperCase(),
        user_name: log.user_name || 'Unknown User',
        entity_name: log.entity_name || 'No Entity'
      }));

      setAuditLogs(transformedData);
      
      // Calculate total pages based on exact count when available
      setTotalPages(Math.max(1, Math.ceil(((count ?? transformedData.length) / pageSize))));
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
      await fetchAuditLogs(1);
    } catch (err: any) {
      console.error('Error logging audit event:', err);
      throw err;
    }
  };

  const clearAuditLogs = async (scope: 'non_admin' | 'all' = 'non_admin') => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('admin_clear_audit_logs', {
        p_scope: scope,
      });

      if (error) throw error;

      // Refetch first page after clearing
      await fetchAuditLogs(1);
      return data;
    } catch (err: any) {
      console.error('Error clearing audit logs:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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

  const getUserActivity = (): UserActivity[] => {
    const userActivity: Record<string, { name: string; count: number; role: string | null }> = {};
    auditLogs.forEach(log => {
      const userId = log.user_id || 'system';
      const userName = log.user_name || 'System';
      const userRole = log.user_role || null;
      
      if (!userActivity[userId]) {
        userActivity[userId] = { name: userName, count: 0, role: userRole };
      }
      userActivity[userId].count++;
    });
    
    return Object.entries(userActivity)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([userId, data]) => ({ userId, name: data.name, count: data.count, role: data.role }));
  };

  useEffect(() => {
    // Only fetch if user has permission to view audit logs
    if (profile?.role === 'admin' || profile?.role === 'head') {
      fetchAuditLogs(currentPage);
    }
  }, [profile, filters, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, page));
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    auditLogs,
    loading,
    error,
    currentPage,
    totalPages,
    logAuditEvent,
    clearAuditLogs,
    getActivitySummary,
    getTableActivity,
    getUserActivity,
    refetch: fetchAuditLogs,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };
};