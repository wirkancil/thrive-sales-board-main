import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface DepartmentActivitiesLogProps {
  selectedDivision: string;
  selectedRep: string;
  dateRange: string;
}

interface ActivityLogEntry {
  id: string;
  date: Date;
  rep: string;
  division: string;
  type: "call" | "email" | "meeting" | "demo" | "follow-up";
  customerName: string;
  notes: string;
  duration?: string;
  outcome?: "positive" | "neutral" | "negative";
  nextAction?: string;
}

export function DepartmentActivitiesLog({ selectedDivision, selectedRep, dateRange }: DepartmentActivitiesLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const getRange = (range: string) => {
    const now = new Date();
    const start = new Date(now);
    switch (range) {
      case "week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        start.setDate(diff);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "quarter": {
        const month = now.getMonth();
        const qStartMonth = month - (month % 3);
        start.setMonth(qStartMonth, 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setMonth(qStartMonth + 3, 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "year": {
        start.setMonth(0, 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "month":
      default: {
        start.setDate(1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1, 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
    }
  };

  const inferType = (subject: string): ActivityLogEntry["type"] => {
    const s = subject.toLowerCase();
    if (s.includes("call") || s.includes("phone")) return "call";
    if (s.includes("email") || s.includes("mail")) return "email";
    if (s.includes("meeting") || s.includes("demo")) return "meeting";
    if (s.includes("follow")) return "follow-up";
    return "meeting"; // default generic
  };

  const mapActivityTypeToLogType = (t?: string): ActivityLogEntry["type"] => {
    if (!t) return "meeting";
    if (t === "call") return "call";
    if (t === "meeting_online") return "meeting";
    if (t === "visit") return "meeting";
    if (t === "go_show") return "demo";
    return "meeting";
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { from, to } = getRange(dateRange);
        let query = supabase
          .from('sales_activity_v2')
          .select('*')
          .gte('created_at', from)
          .lt('created_at', to)
          .order('created_at', { ascending: false });

        if (selectedRep && selectedRep !== 'all') {
          query = query.eq('created_by', selectedRep);
        }

        if (searchTerm) {
          // Use notes & mom_text for search (v2 fields)
          query = query.or(`notes.ilike.%${searchTerm}%,mom_text.ilike.%${searchTerm}%,new_opportunity_name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        // Fallback to legacy table if v2 relation doesn't exist
        if (error && (error.code === '42P01' || (error.message || '').includes('sales_activity_v2'))) {
          let legacyQuery = supabase
            .from('sales_activity')
            .select('*')
            .gte('created_at', from)
            .lt('created_at', to)
            .order('created_at', { ascending: false });

          if (selectedRep && selectedRep !== 'all') {
            legacyQuery = legacyQuery.eq('user_id', selectedRep);
          }

          if (searchTerm) {
            legacyQuery = legacyQuery.or(`notes.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
          }

          const { data: legacyData, error: legacyError } = await legacyQuery;
          if (legacyError) throw legacyError;

          const acts = legacyData || [];
          const userIds = Array.from(new Set(acts.map((a: any) => a.user_id).filter(Boolean)));
          let userMap: Record<string, { name: string; division: string }> = {};

          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('user_id, full_name, division_id')
              .in('user_id', userIds);
            for (const p of profiles || []) {
              userMap[(p as any).user_id] = { name: (p as any).full_name || (p as any).user_id, division: (p as any).division_id || 'Unknown' };
            }
          }

          let filtered = (acts as any[]).map((a: any) => ({
            id: a.id,
            date: new Date(a.created_at || a.activity_time),
            rep: userMap[a.user_id]?.name || a.user_id || 'Unknown',
            division: userMap[a.user_id]?.division || 'Unknown',
            type: mapActivityTypeToLogType(a.activity_type),
            customerName: a.customer_name || '—',
            notes: a.notes || '',
          }));

          if (typeFilter !== 'all') {
            filtered = filtered.filter((f) => f.type === typeFilter);
          }

          setActivities(filtered);
          return;
        }

        if (error) throw error;

        const acts = data || [];
        const userIds = Array.from(new Set(acts.map((a: any) => a.created_by).filter(Boolean)));
        let userMap: Record<string, { name: string; division: string }> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, division_id')
            .in('user_id', userIds);
          for (const p of profiles || []) {
            userMap[(p as any).user_id] = { name: (p as any).full_name || (p as any).user_id, division: (p as any).division_id || 'Unknown' };
          }
        }

        let filtered = (acts as any[]).map((a: any) => ({
          id: a.id,
          date: new Date(a.created_at || a.scheduled_at),
          rep: userMap[a.created_by]?.name || a.created_by || 'Unknown',
          division: userMap[a.created_by]?.division || 'Unknown',
          type: mapActivityTypeToLogType(a.activity_type),
          customerName: '—',
          notes: a.notes || a.mom_text || a.new_opportunity_name || '',
        }));

        if (typeFilter !== 'all') {
          filtered = filtered.filter((f) => f.type === typeFilter);
        }

        setActivities(filtered);
      } catch (err) {
        console.error('Error fetching activities log:', err);
        setActivities([]);
      }
    };

    fetchActivities();
  }, [selectedDivision, selectedRep, dateRange, searchTerm, typeFilter, outcomeFilter]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call": return "bg-blue-100 text-blue-800 border-blue-200";
      case "email": return "bg-green-100 text-green-800 border-green-200";
      case "meeting": return "bg-purple-100 text-purple-800 border-purple-200";
      case "demo": return "bg-orange-100 text-orange-800 border-orange-200";
      case "follow-up": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case "positive": return "bg-green-100 text-green-800 border-green-200";
      case "neutral": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "negative": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes}m ago`;
      }
      return `${Math.round(diffInHours)}h ago`;
    }
    
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activities Log
            </CardTitle>
            <CardDescription>
              Global activity table across all divisions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities, customers, or reps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
                <SelectItem value="demo">Demos</SelectItem>
                <SelectItem value="follow-up">Follow-ups</SelectItem>
              </SelectContent>
            </Select>

            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activities Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Next Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatDate(activity.date)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(activity.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{activity.rep}</div>
                    {activity.duration && (
                      <div className="text-xs text-muted-foreground">{activity.duration}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getDivisionColor(activity.division)} text-xs`}>
                      {activity.division}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getTypeColor(activity.type)} text-xs`}>
                      {activity.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{activity.customerName}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate text-sm" title={activity.notes}>
                      {activity.notes}
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.outcome && (
                      <Badge variant="secondary" className={`${getOutcomeColor(activity.outcome)} text-xs`}>
                        {activity.outcome}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    {activity.nextAction && (
                      <div className="truncate text-sm text-muted-foreground" title={activity.nextAction}>
                        {activity.nextAction}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities found matching your filters.</p>
          </div>
        )}

        {/* Pagination/Load More */}
        {activities.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" size="sm">
              Load More Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}