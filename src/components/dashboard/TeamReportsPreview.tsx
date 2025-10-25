import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Target, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DivisionReportsPreviewProps {
  selectedRep: string;
  dateRange: string;
}

interface ReportCard {
  id: string;
  title: string;
  period: string;
  value: string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  color: string;
}

export function TeamReportsPreview({ selectedRep, dateRange }: DivisionReportsPreviewProps) {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportCard[]>([]);

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setReports([]);
  }, [selectedRep, dateRange]);

  const getChangeIcon = (changeType: string, change: number) => {
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
          {getChangeIcon(changeType, change)}
          {Math.abs(change)}%
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
              Reports Preview
            </CardTitle>
            <CardDescription>
              Key performance metrics and insights
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/reports')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`${report.color}`}>
                    {report.icon}
                  </div>
                  <h5 className="font-medium text-foreground">{report.title}</h5>
                </div>
                {getChangeBadge(report.change, report.changeType)}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{report.value}</p>
                <p className="text-sm text-muted-foreground">{report.period}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t">
          <h5 className="font-medium text-foreground mb-3">Quick Actions</h5>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-4 w-4" />
              Generate Custom Report
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="h-4 w-4" />
              View Detailed Analytics
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/reports')}
            >
              <Target className="h-4 w-4" />
              Performance Benchmarks
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}