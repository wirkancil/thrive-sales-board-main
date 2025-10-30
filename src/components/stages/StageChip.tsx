import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface StageChipProps {
  stage: string;
  daysInStage?: number;
  isOverdue?: boolean;
  className?: string;
}

export const StageChip = ({ stage, daysInStage, isOverdue, className }: StageChipProps) => {
  const getStageColor = () => {
    if (isOverdue) return "destructive";
    
    // Match actual database stage names
    switch (stage) {
      case 'Closed Won':
        return "default";
      case 'Closed Lost':
        return "destructive";
      case 'Proposal/Negotiation':
        return "default";
      case 'Presentation/POC':
        return "secondary";
      case 'Approach/Discovery':
        return "secondary";
      case 'Qualification':
        return "outline";
      case 'Prospecting':
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getStageColor()} className={cn("flex items-center gap-1", className)}>
      {isOverdue ? (
        <AlertTriangle className="h-3 w-3" />
      ) : daysInStage !== undefined && daysInStage > 0 ? (
        <Clock className="h-3 w-3" />
      ) : null}
      <span>{stage}</span>
      {daysInStage !== undefined && daysInStage > 0 && (
        <span className="text-xs">({daysInStage}d)</span>
      )}
    </Badge>
  );
};
