import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStageMetrics, StageMetric } from "@/hooks/useStageMetrics";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  full_name: string;
}

interface OverdueHeatmapProps {
  teamMembers: TeamMember[];
}

const STAGES = ['Prospecting', 'Qualification', 'Discovery', 'Presentation', 'Proposal', 'Closed'];

export const OverdueHeatmap = ({ teamMembers }: OverdueHeatmapProps) => {
  const { metrics, loading } = useStageMetrics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const getHeatValue = (memberId: string, stage: string): number => {
    const memberMetrics = metrics.filter(
      m => m.owner_id === memberId && m.stage.includes(stage.split(' ')[0])
    );
    return memberMetrics.filter(m => m.is_overdue).length;
  };

  const getHeatColor = (value: number): string => {
    if (value === 0) return "bg-green-100 dark:bg-green-950";
    if (value === 1) return "bg-amber-100 dark:bg-amber-950";
    if (value === 2) return "bg-orange-200 dark:bg-orange-900";
    return "bg-destructive/80";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Heatmap</CardTitle>
        <CardDescription>Overdue deals by stage and team member</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `150px repeat(${STAGES.length}, 80px)` }}>
              {/* Header */}
              <div className="font-medium text-sm p-2"></div>
              {STAGES.map(stage => (
                <div key={stage} className="font-medium text-xs p-2 text-center">
                  {stage.split(' ')[0]}
                </div>
              ))}

              {/* Rows */}
              {teamMembers.map(member => (
                <>
                  <div key={`${member.id}-name`} className="text-sm p-2 truncate">
                    {member.full_name}
                  </div>
                  {STAGES.map(stage => {
                    const value = getHeatValue(member.id, stage);
                    return (
                      <div
                        key={`${member.id}-${stage}`}
                        className={cn(
                          "p-2 text-center text-sm font-medium rounded",
                          getHeatColor(value)
                        )}
                      >
                        {value || '-'}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950" />
            None
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950" />
            1
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-900" />
            2
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/80" />
            3+
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
