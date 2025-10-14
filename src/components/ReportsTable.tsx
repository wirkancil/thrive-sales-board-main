import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Download, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  summary: string;
  generated_at: string;
}

interface ReportsTableProps {
  refreshTrigger: number;
}

export function ReportsTable({ refreshTrigger }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user, refreshTrigger]);

  const handleViewReport = (report: Report) => {
    // In a real application, this would open a detailed report view
    toast({
      title: "Report Viewer",
      description: `Opening ${report.title} (This would show the full report in a real application)`,
    });
  };

  const handleDownloadReport = (report: Report) => {
    // In a real application, this would download the report as PDF/Excel
    toast({
      title: "Download Started",
      description: `Downloading ${report.title} (This would generate and download the actual report file)`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl">📊</div>
            <h3 className="text-xl font-semibold text-foreground">No Reports Yet</h3>
            <p className="text-muted-foreground">
              Generate your first report to track your sales performance and get insights into your business.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="bg-card border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{report.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(report.period_start), 'MMM dd')} - {format(parseISO(report.period_end), 'MMM dd, yyyy')}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      Generated {format(parseISO(report.generated_at), 'MMM dd, yyyy')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewReport(report)}
                  className="hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(report)}
                  className="hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {report.summary}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}