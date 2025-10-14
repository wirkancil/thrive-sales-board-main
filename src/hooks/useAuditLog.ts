import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

type AuditEventType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approval' | 'reassignment' | 'closed_won' | 'closed_lost';
type AuditObjectType = 'user' | 'customer' | 'contact' | 'end_user' | 'opportunity' | 'deal' | 'activity' | 'target' | 'pipeline';

interface AuditLogEntry {
  event_type: AuditEventType;
  object_type: AuditObjectType;
  object_id: string;
  before_values?: any;
  after_values?: any;
  reason?: string;
  metadata?: any;
}

export const useAuditLog = () => {
  const { isAdmin } = useProfile();

  const logAuditEvent = async (entry: AuditLogEntry) => {
    try {
      // Get client IP and user agent if available
      const metadata = {
        ...entry.metadata,
        user_agent: navigator?.userAgent,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('audit_log')
        .insert({
          event_type: entry.event_type,
          object_type: entry.object_type,
          object_id: entry.object_id,
          before_values: entry.before_values ? JSON.stringify(entry.before_values) : null,
          after_values: entry.after_values ? JSON.stringify(entry.after_values) : null,
          reason: entry.reason,
          metadata: JSON.stringify(metadata),
        });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw - audit logging failures shouldn't break the main operation
      }
    } catch (err) {
      console.error('Error logging audit event:', err);
      // Don't throw - audit logging is optional
    }
  };

  const fetchAuditLogs = async (filters?: {
    object_type?: AuditObjectType;
    object_id?: string;
    event_type?: AuditEventType;
    limit?: number;
  }) => {
    if (!isAdmin()) {
      throw new Error('Only admins can view audit logs');
    }

    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.object_type) {
        query = query.eq('object_type', filters.object_type);
      }
      if (filters?.object_id) {
        query = query.eq('object_id', filters.object_id);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  };

  return {
    logAuditEvent,
    fetchAuditLogs,
    canViewAuditLogs: isAdmin(),
  };
};