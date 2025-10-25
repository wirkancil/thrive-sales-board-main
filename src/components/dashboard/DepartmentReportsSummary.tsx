import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Target, DollarSign, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DepartmentReportsSummaryProps {
  selectedDivision: string;
  selectedRep: string;
  dateRange: string;
}

interface KPIData {
  title: string;
  value: string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  color: string;
}

export function DepartmentReportsSummary({ selectedDivision, selectedRep, dateRange }: DepartmentReportsSummaryProps) {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    // Initialize with empty data - real data would come from API based on filters
    setKpiData([]);
  }, [selectedDivision, selectedRep, dateRange]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false);
      navigate('/reports');
    }, 2000);
  };

  const getChangeIcon = (changeType: string) => {
    if (changeType === "increase") {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    } else if (changeType === "decrease") {
      return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    }
    return null;
  };

  const getChangeBadge = (change: number, changeType: string) => {
    const isPositive = changeType === "increase";
    const bgColor = isPositive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200";
    
    return (
      <Badge variant="secondary" className={`${bgColor} text-xs`}>
        <span className="flex items-center gap-1">
          {getChangeIcon(changeType)}
          {isPositive ? "+" : ""}{change}%
        </span>
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Reports Summary
            </CardTitle>
            <CardDescription>
              Key performance indicators across all divisions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* KPI Cards */}
        <div className="space-y-4 mb-6">
          {kpiData.map((kpi, index) => (
            <div
              key={index}
              className="p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <h5 className="font-medium text-foreground">{kpi.title}</h5>
                </div>
                {getChangeBadge(kpi.change, kpi.changeType)}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">
                  vs previous {dateRange === "week" ? "week" : dateRange === "month" ? "month" : "period"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Report Generation */}
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-foreground mb-1">Department Report</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Generate comprehensive department-wide performance report including all divisions, KPIs, and trend analysis.
                </p>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full"
                  size="sm"
                >
                  {isGeneratingReport ? "Generating..." : "Generate Department Report"}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Report Options */}
          <div className="space-y-2">
            <h5 className="font-medium text-foreground">Quick Reports</h5>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/reports')}
              >
                <Target className="h-4 w-4" />
                Division Performance Comparison
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/reports')}
              >
                <TrendingUp className="h-4 w-4" />
                Monthly Trends Analysis
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/reports')}
              >
                <Users className="h-4 w-4" />
                Sales Rep Performance
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/analytics')}
              >
                <DollarSign className="h-4 w-4" />
                Revenue Forecasting
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mt-6 pt-4 border-t">
          <h5 className="font-medium text-foreground mb-3">Recent Reports</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div>
                <span className="font-medium">Q4 Department Summary</span>
                <span className="text-muted-foreground ml-2">• Dec 15, 2024</span>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div>
                <span className="font-medium">Weekly Division Comparison</span>
                <span className="text-muted-foreground ml-2">• Dec 12, 2024</span>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div>
                <span className="font-medium">Sales Rep Performance</span>
                <span className="text-muted-foreground ml-2">• Dec 10, 2024</span>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}