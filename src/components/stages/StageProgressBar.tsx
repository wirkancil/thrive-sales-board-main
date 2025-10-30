import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageProgressBarProps {
  currentStage: string;
  stageEnteredAt?: string | null;
  daysInStage?: number;
  isOverdue?: boolean;
  className?: string;
}

const STAGES = [
  { key: 'Prospecting', label: 'Prospecting', normalized: 'prospecting' },
  { key: 'Qualification', label: 'Qualification', normalized: 'qualification' },
  { key: 'Approach/Discovery', label: 'Discovery', normalized: 'approachdiscovery' },
  { key: 'Presentation/POC', label: 'Presentation', normalized: 'presentationpoc' },
  { key: 'Proposal/Negotiation', label: 'Proposal', normalized: 'proposalnegotiation' },
  { key: 'Closed Won', label: 'Won', normalized: 'closedwon' },
];

export const StageProgressBar = ({
  currentStage,
  stageEnteredAt,
  daysInStage = 0,
  isOverdue = false,
  className
}: StageProgressBarProps) => {
  const normalizedStage = currentStage?.toLowerCase().replace(/[\s\/]/g, '') || 'prospecting';
  const currentIndex = STAGES.findIndex(s => normalizedStage.includes(s.normalized));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector Line */}
              {index < STAGES.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5",
                    isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                  )}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Stage Circle */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && !isOverdue && "border-primary bg-background text-primary",
                    isCurrent && isOverdue && "border-destructive bg-destructive text-destructive-foreground",
                    isUpcoming && "border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isCurrent && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>

                {/* Days in Stage Indicator */}
                {isCurrent && daysInStage > 0 && (
                  <span
                    className={cn(
                      "mt-1 text-xs",
                      isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {daysInStage}d
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
