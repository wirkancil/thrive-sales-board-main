import { useState } from "react";
import { GenerateReportModal } from "@/components/modals/GenerateReportModal";
import ReportBuilder from "@/components/advanced/ReportBuilder";
import { ReportsTable } from "@/components/ReportsTable";

export default function Reports() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportGenerated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate custom reports with advanced analytics and automated scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateReportModal onReportGenerated={handleReportGenerated} />
        </div>
      </div>
      
      <ReportBuilder />
      
      <ReportsTable refreshTrigger={refreshTrigger} />
    </div>
  );
}