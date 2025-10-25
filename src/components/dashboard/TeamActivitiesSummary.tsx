import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Phone, Mail, Calendar, Users, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DivisionActivitiesSummaryProps {
  selectedRep: string;
  dateRange: string;
}

interface ActivitySummary {
  id: string;
  type: "call" | "email" | "meeting";
  customerName: string;
  salesRep: {
    name: string;
    avatar?: string;
    initials: string;
  };
  timestamp: Date;
  notes: string;
  status: "completed" | "scheduled" | "pending";
}

export function TeamActivitiesSummary({ selectedRep, dateRange }: DivisionActivitiesSummaryProps) {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setActivities([]);
  }, [selectedRep, dateRange]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "call": return "bg-blue-500";
      case "email": return "bg-green-500";
      case "meeting": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "scheduled":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (Math.abs(diffInHours) < 1) {
      const diffInMinutes = Math.round((date.getTime() - now.getTime()) / (1000 * 60));
      if (diffInMinutes === 0) return "Just now";
      if (diffInMinutes > 0) return `In ${diffInMinutes}m`;
      return `${Math.abs(diffInMinutes)}m ago`;
    }
    
    if (Math.abs(diffInHours) < 24) {
      if (diffInHours > 0) return `In ${Math.round(diffInHours)}h`;
      return `${Math.round(Math.abs(diffInHours))}h ago`;
    }
    
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => 
    activityFilter === "all" || activity.type === activityFilter
  );

  const activityStats = {
    total: activities.length,
    calls: activities.filter(a => a.type === "call").length,
    emails: activities.filter(a => a.type === "email").length,
    meetings: activities.filter(a => a.type === "meeting").length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Activities Summary
            </CardTitle>
            <CardDescription>
              Recent sales activities across your division
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Activity Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{activityStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{activityStats.calls}</p>
            <p className="text-xs text-muted-foreground">Calls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{activityStats.emails}</p>
            <p className="text-xs text-muted-foreground">Emails</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{activityStats.meetings}</p>
            <p className="text-xs text-muted-foreground">Meetings</p>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Recent Activities</h4>
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Activity Icon */}
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-medium text-foreground">{activity.customerName}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {getStatusBadge(activity.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Sales Rep */}
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.salesRep.avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {activity.salesRep.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{activity.salesRep.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities found for the selected filter.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}