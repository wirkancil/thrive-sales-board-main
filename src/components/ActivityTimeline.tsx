import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, Mail, Calendar, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/constants";
import ActivityLogModal from "@/components/modals/ActivityLogModal";

interface Activity {
  id: string;
  subject: string;
  description: string | null;
  status: 'open' | 'completed';
  due_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  opportunity_id: string | null;
}

interface ActivityTimelineProps {
  opportunityId?: string;
  limit?: number;
  className?: string;
}

const getActivityIcon = (subject: string) => {
  const lowerSubject = subject.toLowerCase();
  if (lowerSubject.includes('call') || lowerSubject.includes('phone')) {
    return Phone;
  } else if (lowerSubject.includes('email') || lowerSubject.includes('mail')) {
    return Mail;
  } else if (lowerSubject.includes('meeting') || lowerSubject.includes('demo')) {
    return Calendar;
  } else {
    return FileText;
  }
};

export const ActivityTimeline = ({ 
  opportunityId, 
  limit = 10, 
  className = "" 
}: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('sales_activity_v2')
        .select('*')
        .order('created_at', { ascending: false });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      // Fallback when v2 relation is missing
      if (error && (error.code === '42P01' || (error.message || '').includes('sales_activity_v2'))) {
        let legacyQuery = supabase
          .from('sales_activity')
          .select('*')
          .order('created_at', { ascending: false });

        if (limit) {
          legacyQuery = legacyQuery.limit(limit);
        }

        const { data: legacyData, error: legacyError } = await legacyQuery;
        if (legacyError) throw legacyError;

        setActivities((legacyData || []).map((activity: any) => ({
          id: activity.id,
          subject: activity.activity_type ? String(activity.activity_type).replace('_', ' ') : 'Activity',
          description: activity.notes || null,
          status: 'open',
          due_at: null,
          created_at: (activity.created_at || activity.activity_time || new Date().toISOString()),
          updated_at: (activity.created_at || activity.activity_time || new Date().toISOString()),
          created_by: activity.user_id,
          opportunity_id: null,
        })));
        return;
      }
      
      if (error) throw error;
      setActivities((data || []).map((activity: any) => ({
        id: activity.id,
        subject: activity.activity_type ? String(activity.activity_type).replace('_', ' ') : 'Activity',
        description: activity.notes || null,
        status: activity.status === 'done' ? 'completed' : 'open',
        due_at: null,
        created_at: (activity.created_at || activity.scheduled_at || new Date().toISOString()),
        updated_at: (activity.created_at || activity.scheduled_at || new Date().toISOString()),
        created_by: activity.created_by,
        opportunity_id: activity.opportunity_id
      })));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [opportunityId, limit]);

  const handleActivityAdded = () => {
    fetchActivities();
    setShowActivityModal(false);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowActivityModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities logged yet</p>
              <p className="text-sm">Click "Add Activity" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.subject);
                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{activity.subject}</p>
                        <Badge 
                          variant={activity.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(activity.created_at)}</span>
                        {activity.due_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(activity.due_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityLogModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        opportunityId={opportunityId}
        onActivityAdded={handleActivityAdded}
      />
    </>
  );
};