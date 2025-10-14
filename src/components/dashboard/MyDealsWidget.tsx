import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStageMetrics } from "@/hooks/useStageMetrics";
import { Loader2, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const MyDealsWidget = () => {
  const { user } = useAuth();
  const { metrics, loading, getOverdueCount, getAverageDaysInStage } = useStageMetrics(user?.id);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Active Deals",
      value: metrics.length,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Overdue",
      value: getOverdueCount(),
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      label: "Avg Days/Stage",
      value: getAverageDaysInStage(),
      icon: Clock,
      color: "text-amber-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
