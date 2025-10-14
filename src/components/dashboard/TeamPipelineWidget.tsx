import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStageMetrics } from "@/hooks/useStageMetrics";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
}

interface TeamPipelineWidgetProps {
  teamMembers: TeamMember[];
}

export const TeamPipelineWidget = ({ teamMembers }: TeamPipelineWidgetProps) => {
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

  const teamMetrics = teamMembers.map(member => {
    const memberDeals = metrics.filter(m => m.owner_id === member.id);
    const totalPoints = memberDeals.reduce((sum, m) => sum + m.points, 0);
    const overdueCount = memberDeals.filter(m => m.is_overdue).length;
    
    return {
      name: member.full_name,
      dealCount: memberDeals.length,
      points: totalPoints,
      overdueCount,
    };
  });

  const maxPoints = Math.max(...teamMetrics.map(m => m.points), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Pipeline</CardTitle>
        <CardDescription>Points by team member</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMetrics.map((member) => (
          <div key={member.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{member.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{member.dealCount} deals</span>
                <span className="font-semibold">{member.points} pts</span>
                {member.overdueCount > 0 && (
                  <span className="text-destructive text-xs">
                    {member.overdueCount} overdue
                  </span>
                )}
              </div>
            </div>
            <Progress value={(member.points / maxPoints) * 100} />
          </div>
        ))}
        {teamMetrics.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};
