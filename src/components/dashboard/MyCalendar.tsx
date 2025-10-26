import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isWithinInterval, addDays, startOfDay, isSameDay, addHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  subject: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string;
}

export const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const today = new Date();
        const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from('sales_activity_v2')
          .select('*')
          .eq('created_by', user.user.id)
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', today.toISOString())
          .lte('scheduled_at', oneWeekFromNow.toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5);

        if (error) throw error;
        const mapped: CalendarEvent[] = (data || []).map((a: any) => ({
          id: a.id,
          subject: a.subject || (a.activity_type ? String(a.activity_type).replace('_', ' ') : 'Activity'),
          starts_at: a.scheduled_at,
          ends_at: null,
          location: null,
          description: a.description || a.notes || null,
          type: a.activity_type || null,
          status: a.status || undefined,
        }));
        setEvents(mapped);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatEventTime = (dateString: string) => {
    const eventDate = parseISO(dateString);
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);

    let dateLabel = '';
    if (isSameDay(eventDate, today)) {
      dateLabel = 'Today';
    } else if (isSameDay(eventDate, tomorrow)) {
      dateLabel = 'Tomorrow';
    } else if (isWithinInterval(eventDate, { start: today, end: addDays(today, 7) })) {
      dateLabel = format(eventDate, 'EEEE');
    } else {
      dateLabel = format(eventDate, 'MMM d');
    }

    const timeLabel = format(eventDate, 'h:mm a');
    return { dateLabel, timeLabel };
  };

  const getEventIcon = (type?: string | null) => {
    switch(type) {
      case 'call': return Phone;
      case 'meeting':
      case 'meeting_online': return Video;
      case 'demo': return CalendarIcon;
      case 'visit': return MapPin;
      case 'go_show': return CalendarIcon;
      default: return CalendarIcon;
    }
  };

  const getEventTypeColor = (type?: string | null) => {
    switch(type) {
      case 'call': return 'bg-green-100 text-green-800';
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'demo': return 'bg-purple-100 text-purple-800';
      case 'follow-up': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isEventSoon = (dateString: string) => {
    const eventDate = parseISO(dateString);
    const now = new Date();
    const oneHourFromNow = addHours(now, 1);
    return isWithinInterval(eventDate, { start: now, end: oneHourFromNow });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Calendar</CardTitle>
          <CardDescription>Loading your upcoming events...</CardDescription>
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
            <CalendarIcon className="h-5 w-5" />
            My Calendar
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/calendar')}
          >
            View Calendar
          </Button>
        </CardTitle>
        <CardDescription>Upcoming meetings and events</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No upcoming events this week</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/calendar')}
            >
              Schedule Meeting
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const { dateLabel, timeLabel } = formatEventTime(event.starts_at);
              const Icon = getEventIcon(event.type);
              const showSoonBadge = isEventSoon(event.starts_at);
              
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-1.5 rounded-md",
                          getEventTypeColor(event.type)
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-medium text-sm truncate">{event.subject}</h4>
                        {showSoonBadge && (
                          <Badge variant="default" className="text-xs">
                            Starting Soon
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{dateLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{timeLabel}</span>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
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
  );
};