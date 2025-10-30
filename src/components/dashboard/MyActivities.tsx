import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, FileText, Phone, Mail, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  activity_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  customer_name?: string;
  opportunity_name?: string;
}

export const MyActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: activitiesData, error } = await supabase
          .from('sales_activity_v2')
          .select(`
            id,
            activity_type,
            scheduled_at,
            status,
            notes,
            customer_name,
            opportunity_id
          `)
          .eq('created_by', user.user.id)
          .order('scheduled_at', { ascending: false })
          .limit(5);

        // Fallback to legacy table if v2 relation is missing
        if (error && (error.code === '42P01' || (error.message || '').includes('sales_activity_v2'))) {
          const { data: legacyData, error: legacyError } = await supabase
            .from('sales_activity')
            .select('id, activity_type, activity_time, created_at, notes, customer_name')
            .eq('user_id', user.user.id)
            .order('created_at', { ascending: false })
            .limit(5);
          if (legacyError) throw legacyError;

          const formattedActivities = (legacyData || []).map((activity: any) => ({
            id: activity.id,
            activity_type: activity.activity_type,
            scheduled_at: activity.activity_time || activity.created_at,
            status: 'scheduled',
            notes: activity.notes,
            customer_name: activity.customer_name || 'Unknown Customer',
            opportunity_name: undefined,
          }));
          setActivities(formattedActivities);
          return;
        }

        if (activitiesData) {
          const formattedActivities = activitiesData.map(activity => ({
            ...activity,
            customer_name: activity.customer_name || 'Unknown Customer',
            opportunity_name: undefined // opportunity_id is available but we'd need to join to get name
          }));
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'call': <Phone className="h-4 w-4" />,
      'email': <Mail className="h-4 w-4" />,
      'meeting': <CalendarIcon className="h-4 w-4" />,
      'follow_up': <Clock className="h-4 w-4" />,
      'presentation': <FileText className="h-4 w-4" />
    };
    return icons[type] || <User className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActivityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'call': 'bg-blue-100 text-blue-800',
      'email': 'bg-purple-100 text-purple-800',
      'meeting': 'bg-green-100 text-green-800',
      'follow_up': 'bg-orange-100 text-orange-800',
      'presentation': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Activities</CardTitle>
          <CardDescription>Loading your recent activities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Activities
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/activities')}
          >
            View All
          </Button>
        </CardTitle>
        <CardDescription>Recent account activities and tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No recent activities found</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/activities')}
            >
              Create New Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 p-2 bg-muted rounded-full">
                  {getActivityIcon(activity.activity_type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={getActivityTypeColor(activity.activity_type)}
                      >
                        {activity.activity_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(activity.status)}
                      >
                        {activity.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(activity.scheduled_at)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">{activity.customer_name}</p>
                    {activity.opportunity_name && (
                      <p className="text-sm text-muted-foreground">
                        Related to: {activity.opportunity_name}
                      </p>
                    )}
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};