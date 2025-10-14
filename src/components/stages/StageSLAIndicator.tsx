import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageSLAIndicatorProps {
  daysInStage: number;
  dueDays: number;
  isOverdue: boolean;
  stageName: string;
  className?: string;
}

export const StageSLAIndicator = ({
  daysInStage,
  dueDays,
  isOverdue,
  stageName,
  className
}: StageSLAIndicatorProps) => {
  const daysRemaining = dueDays - daysInStage;
  const isApproachingDue = daysRemaining > 0 && daysRemaining <= 2;
  const isOnTrack = daysRemaining > 2;

  if (isOverdue) {
    return (
      <Alert variant="destructive" className={cn(className)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Stage Overdue</AlertTitle>
        <AlertDescription>
          This opportunity has been in {stageName} for {daysInStage} days 
          ({Math.abs(daysRemaining)} days overdue). Consider advancing or updating the timeline.
        </AlertDescription>
      </Alert>
    );
  }

  if (isApproachingDue) {
    return (
      <Alert className={cn("border-amber-500 bg-amber-50 dark:bg-amber-950", className)}>
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Approaching Due Date</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in {stageName}. 
          Plan to advance or extend the timeline soon.
        </AlertDescription>
      </Alert>
    );
  }

  if (isOnTrack) {
    return (
      <Alert className={cn("border-green-500 bg-green-50 dark:bg-green-950", className)}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">On Track</AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to complete {stageName}.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
