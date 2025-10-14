import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesAnalyticsDashboard } from "@/components/dashboard/SalesAnalyticsDashboard";
import RealTimeAnalyticsDashboard from "@/components/advanced/RealTimeAnalyticsDashboard";
import PipelineHealthScoring from "@/components/advanced/PipelineHealthScoring";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("realtime");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights, predictive analytics, and AI-powered performance tracking
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime">Real-Time Dashboard</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Health</TabsTrigger>
          <TabsTrigger value="classic">Classic Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="pipeline" className="space-y-6">
          <PipelineHealthScoring />
        </TabsContent>
        
        <TabsContent value="classic" className="space-y-6">
          <SalesAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}