import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Users, Plus, Search, Calendar as CalendarIcon, List, Grid3X3, Filter, ChevronDown, User, UserCheck, CheckSquare, CalendarDays } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, startOfWeek as startOfWeekDate, endOfWeek as endOfWeekDate } from "date-fns";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  type: "internal" | "sales-call" | "demo" | "review";
  description?: string;
}

const initialMeetings: Meeting[] = [
  {
    id: "1",
    title: "Client Demo - ABC Corp",
    date: "2024-01-15",
    time: "10:00",
    attendees: ["John Smith", "Client Team"],
    type: "demo",
    description: "Product demonstration for potential client"
  },
  {
    id: "2",
    title: "Sales Team Standup",
    date: "2024-01-15",
    time: "14:00",
    attendees: ["Sales Team"],
    type: "internal",
    description: "Weekly team sync and pipeline review"
  },
  {
    id: "3",
    title: "Proposal Review - XYZ Ltd",
    date: "2024-01-16",
    time: "11:00",
    attendees: ["Sarah Johnson", "XYZ Team"],
    type: "sales-call",
    description: "Final proposal presentation"
  },
  {
    id: "4",
    title: "Product Demo - Tech Solutions",
    date: "2024-01-17",
    time: "15:00",
    attendees: ["Mike Wilson", "Tech Solutions"],
    type: "demo",
    description: "Technical product demonstration"
  },
  {
    id: "5",
    title: "Quarterly Review",
    date: "2024-01-18",
    time: "09:00",
    attendees: ["Management Team"],
    type: "review",
    description: "Q4 performance review and Q1 planning"
  },
  {
    id: "6",
    title: "Customer Success Call",
    date: "2024-01-22",
    time: "13:30",
    attendees: ["Customer Success Team", "Key Accounts"],
    type: "sales-call",
    description: "Monthly check-in with key customers"
  }
];

export function MeetingCalendar() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "week" | "team" | "tasks">("all");
  const [isGoogleConnected] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    attendees: [],
    type: "internal",
    description: ""
  });

  const getMeetingTypeBadge = (type: string) => {
    const variants = {
      internal: "bg-blue/10 text-blue-700 border-blue/20",
      "sales-call": "bg-green/10 text-green-700 border-green/20",
      demo: "bg-purple/10 text-purple-700 border-purple/20",
      review: "bg-orange/10 text-orange-700 border-orange/20",
    };
    return variants[type as keyof typeof variants] || variants.internal;
  };

  const getFilteredMeetings = () => {
    let filtered = meetings;
    const today = new Date();
    const startOfWeekDate = startOfWeek(today);
    const endOfWeekDate = endOfWeek(today);

    switch (activeFilter) {
      case "today":
        filtered = meetings.filter(meeting => 
          isSameDay(new Date(meeting.date), today)
        );
        break;
      case "week":
        filtered = meetings.filter(meeting => {
          const meetingDate = new Date(meeting.date);
          return meetingDate >= startOfWeekDate && meetingDate <= endOfWeekDate;
        });
        break;
      case "team":
        filtered = meetings.filter(meeting => meeting.type === "internal");
        break;
      case "tasks":
        filtered = meetings.filter(meeting => meeting.type === "review");
        break;
      default:
        filtered = meetings;
    }

    return filtered.filter(meeting =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.attendees.some(attendee => attendee.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredMeetings = getFilteredMeetings();

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const dayMeetings = filteredMeetings.filter(meeting => meeting.date === selectedDateKey);

  const upcomingMeetings = filteredMeetings
    .filter(meeting => new Date(meeting.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const handleAddMeeting = () => {
    if (newMeeting.title && newMeeting.date && newMeeting.time) {
      const meeting: Meeting = {
        id: Date.now().toString(),
        title: newMeeting.title,
        date: newMeeting.date,
        time: newMeeting.time,
        attendees: newMeeting.attendees || [],
        type: newMeeting.type as Meeting["type"],
        description: newMeeting.description || ""
      };
      setMeetings([...meetings, meeting]);
      setNewMeeting({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
        attendees: [],
        type: "internal",
        description: ""
      });
      setIsAddMeetingOpen(false);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  });

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const getDayMeetings = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return filteredMeetings.filter(meeting => meeting.date === dateKey);
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meeting Calendar</h2>
          <p className="text-slate-600">Manage your meetings and schedule</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isGoogleConnected ? (
            <Button variant="outline" className="bg-white border-blue/20 text-blue-700 hover:bg-blue/5">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          ) : (
            <Button variant="outline" className="bg-white border-green/20 text-green-700 hover:bg-green/5">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Google Calendar Connected
            </Button>
          )}
          
          <Dialog open={isAddMeetingOpen} onOpenChange={setIsAddMeetingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="Enter meeting title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="type">Meeting Type</Label>
                  <Select value={newMeeting.type} onValueChange={(value) => setNewMeeting({ ...newMeeting, type: value as Meeting["type"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="sales-call">Sales Call</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                  <Input
                    id="attendees"
                    value={newMeeting.attendees?.join(", ")}
                    onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value.split(",").map(a => a.trim()) })}
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                    placeholder="Meeting description (optional)"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddMeetingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMeeting} className="bg-blue-600 hover:bg-blue-700">
                    Add Meeting
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("monthly")}
            className={viewMode === "monthly" ? "bg-blue-600" : "bg-white border-slate-200"}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Monthly
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("weekly")}
            className={viewMode === "weekly" ? "bg-blue-600" : "bg-white border-slate-200"}
          >
            <List className="h-4 w-4 mr-2" />
            Weekly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between mb-4 lg:hidden">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="lg:block">
              <Card className="bg-white border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { key: "all", label: "All Meetings", icon: CalendarDays },
                    { key: "today", label: "Today", icon: Clock },
                    { key: "week", label: "This Week", icon: CalendarIcon },
                    { key: "team", label: "Team", icon: Users },
                    { key: "tasks", label: "My Tasks", icon: CheckSquare },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={activeFilter === key ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start text-left ${
                        activeFilter === key 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setActiveFilter(key as typeof activeFilter)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
        {/* Calendar View */}
        <div className="lg:col-span-3">
          {viewMode === "monthly" ? (
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">Monthly View - {format(selectedDate, "MMMM yyyy")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-semibold ring-2 ring-primary",
                    day_outside: "text-slate-400 opacity-50",
                    day_disabled: "text-slate-400 opacity-50",
                    day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                    day_hidden: "invisible",
                  }}
                />
                
                {/* Selected Date Meetings */}
                {dayMeetings.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold text-slate-800">
                      Meetings for {format(selectedDate, "EEEE, MMMM d")}
                    </h4>
                    {dayMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h5 className="font-medium text-slate-800">{meeting.title}</h5>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {meeting.attendees.join(", ")}
                              </div>
                            </div>
                            {meeting.description && (
                              <p className="text-sm text-slate-600">{meeting.description}</p>
                            )}
                          </div>
                          <Badge className={`${getMeetingTypeBadge(meeting.type)} border`}>
                            {meeting.type.replace("-", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Weekly View - {format(startOfWeek(currentWeek), "MMM d")} - {format(endOfWeek(currentWeek), "MMM d, yyyy")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={prevWeek} className="text-white hover:bg-blue-500">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextWeek} className="text-white hover:bg-blue-500">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const dayMeetingsForWeek = getDayMeetings(day);
                    return (
                      <div key={day.toISOString()} className="space-y-2">
                        <div className={`text-center p-2 rounded-lg ${isSameDay(day, new Date()) ? 'bg-accent text-accent-foreground font-semibold ring-2 ring-primary' : 'text-muted-foreground'}`}>
                          <div className="text-xs">{format(day, "EEE")}</div>
                          <div className="text-lg">{format(day, "d")}</div>
                        </div>
                        
                        <div className="space-y-1">
                          {dayMeetingsForWeek.map((meeting) => (
                            <div
                              key={meeting.id}
                              className="p-2 text-xs bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => setSelectedDate(day)}
                            >
                              <div className="font-medium text-blue-900 truncate">{meeting.title}</div>
                              <div className="text-blue-700">{meeting.time}</div>
                              <Badge className={`${getMeetingTypeBadge(meeting.type)} text-xs px-1 py-0 mt-1 border`}>
                                {meeting.type.replace("-", " ")}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Meetings Sidebar */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(new Date(meeting.date))}
                >
                  <div className="space-y-2">
                    <h5 className="font-medium text-slate-800 text-sm">{meeting.title}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {format(new Date(meeting.date), "MMM d")} at {meeting.time}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users className="h-3 w-3" />
                      {meeting.attendees.length} attendees
                    </div>
                    <Badge className={`${getMeetingTypeBadge(meeting.type)} text-xs border`}>
                      {meeting.type.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                No upcoming meetings
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}