import { SalesActivityTracker } from "@/components/dashboard/SalesActivityTracker";

export default function Activities() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Sales Activities</h1>
      </div>
      
      <SalesActivityTracker />
    </div>
  );
}