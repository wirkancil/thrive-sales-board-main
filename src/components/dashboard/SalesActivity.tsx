import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Phone, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SalesActivity as SalesActivityType, UserProfile } from "@/hooks/useRoleBasedData";

interface SalesActivityProps {
  activities: SalesActivityType[];
  userProfile: UserProfile | null;
}

const activities = [
  {
    id: 1,
    date: "2024-01-15",
    salesRep: "John Smith",
    activityType: "Call",
    status: "Completed",
    contact: "ABC Corp",
    notes: "Follow-up call completed",
  },
  {
    id: 2,
    date: "2024-01-15",
    salesRep: "Sarah Johnson",
    activityType: "Email",
    status: "Scheduled",
    contact: "XYZ Ltd",
    notes: "Proposal sent for review",
  },
  {
    id: 3,
    date: "2024-01-14",
    salesRep: "Mike Wilson",
    activityType: "Meeting",
    status: "Completed",
    contact: "Tech Solutions",
    notes: "Product demo completed",
  },
  {
    id: 4,
    date: "2024-01-14",
    salesRep: "Emily Davis",
    activityType: "Call",
    status: "Scheduled",
    contact: "Global Inc",
    notes: "Initial outreach call",
  },
  {
    id: 5,
    date: "2024-01-13",
    salesRep: "John Smith",
    activityType: "Meeting",
    status: "Completed",
    contact: "StartupCo",
    notes: "Pricing discussion",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "Call":
      return <Phone className="h-4 w-4" />;
    case "Email":
      return <Mail className="h-4 w-4" />;
    case "Meeting":
      return <Calendar className="h-4 w-4" />;
    default:
      return <Phone className="h-4 w-4" />;
  }
};

export function SalesActivity({ activities, userProfile }: SalesActivityProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = activityTypeFilter === "all" || activity.activity_type.toLowerCase() === activityTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Activities</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search activities..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activities found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {format(new Date(activity.activity_time), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{format(new Date(activity.activity_time), 'HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.activity_type)}
                        {activity.activity_type}
                      </div>
                    </TableCell>
                    <TableCell>{activity.customer_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {activity.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}