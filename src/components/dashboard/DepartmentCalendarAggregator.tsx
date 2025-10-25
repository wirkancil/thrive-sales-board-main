import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DepartmentCalendarAggregatorProps {
  selectedDivision: string;
  selectedRep: string;
  dateRange: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: "meeting" | "call" | "demo" | "training" | "review";
  startTime: Date;
  endTime: Date;
  location?: string;
  division: string;
  organizer: {
    name: string;
    avatar?: string;
    initials: string;
  };
  attendees: {
    name: string;
    avatar?: string;
    initials: string;
    isExternal?: boolean;
  }[];
  customerName?: string;
  priority: "high" | "medium" | "low";
}

export function DepartmentCalendarAggregator({ selectedDivision, selectedRep, dateRange }: DepartmentCalendarAggregatorProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setEvents([]);
  }, [selectedDivision, selectedRep, dateRange]);

  const getDivisionColor = (division: string) => {
    const colors = {
      "North": "bg-blue-100 text-blue-800 border-blue-200",
      "South": "bg-green-100 text-green-800 border-green-200",
      "East": "bg-purple-100 text-purple-800 border-purple-200",
      "West": "bg-orange-100 text-orange-800 border-orange-200",
      "International": "bg-pink-100 text-pink-800 border-pink-200"
    };
    return colors[division as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "demo": return "bg-purple-100 text-purple-800 border-purple-200";
      case "meeting": return "bg-blue-100 text-blue-800 border-blue-200";
      case "call": return "bg-green-100 text-green-800 border-green-200";
      case "training": return "bg-orange-100 text-orange-800 border-orange-200";
      case "review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  const formatEventTime = (startTime: Date, endTime: Date) => {
    const start = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  const formatEventDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.startTime.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendar Aggregator
            </CardTitle>
            <CardDescription>
              Unified calendar with events from all divisions
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/calendar')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Full Calendar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground">Upcoming Events</h4>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              This Week
            </span>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Division Legend */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Divisions:</span>
          {["North", "South", "East", "West", "International"].map((division) => (
            <Badge key={division} variant="secondary" className={`${getDivisionColor(division)} text-xs`}>
              {division}
            </Badge>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground border-b pb-1">
                {formatEventDate(new Date(dateStr))}
              </h5>
              
              <div className="space-y-2">
                {groupedEvents[dateStr].map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 bg-card border-l-4 ${getPriorityColor(event.priority)} rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}
                    onClick={() => navigate('/calendar')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h6 className="font-medium text-foreground">{event.title}</h6>
                          <Badge variant="secondary" className={`${getEventTypeColor(event.type)} text-xs`}>
                            {event.type}
                          </Badge>
                          <Badge variant="secondary" className={`${getDivisionColor(event.division)} text-xs`}>
                            {event.division}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatEventTime(event.startTime, event.endTime)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        
                        {event.customerName && (
                          <p className="text-sm text-primary mb-2">
                            Client: {event.customerName}
                          </p>
                        )}
                        
                        {/* Organizer and Attendees */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Organizer:</span>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={event.organizer.avatar} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {event.organizer.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{event.organizer.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <div className="flex items-center gap-1">
                              {event.attendees.slice(0, 3).map((attendee, index) => (
                                <Avatar key={index} className="h-5 w-5">
                                  <AvatarImage src={attendee.avatar} />
                                  <AvatarFallback className={`text-xs ${attendee.isExternal ? 'bg-orange-100 text-orange-800' : 'bg-secondary/50 text-secondary-foreground'}`}>
                                    {attendee.initials}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {event.attendees.length > 3 && (
                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">
                                    +{event.attendees.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events scheduled.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}