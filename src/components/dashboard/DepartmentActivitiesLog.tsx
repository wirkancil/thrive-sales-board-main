import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setActivities([]);
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