import { CalendarView } from '@/components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
      </div>
      
      <CalendarView />
    </div>
  );
}