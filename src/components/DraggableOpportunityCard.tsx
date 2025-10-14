import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatCurrency, formatDate, STAGE_PROBABILITIES, computeCumulativePerformanceScore } from "@/lib/constants";
import { StageChip } from "@/components/stages/StageChip";
import { StageProgressBar } from "@/components/stages/StageProgressBar";

interface Opportunity {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  stage: string;
  stage_id: string;
  next_step_title: string | null;
  next_step_due_date: string | null;
  probability: number;
  created_at: string;
  owner_id: string;
  customer_id: string;
  expected_close_date: string | null;
  last_activity_at: string | null;
  stage_entered_at?: string | null;
  days_in_stage?: number;
  is_overdue?: boolean;
}

interface DraggableOpportunityCardProps {
  opportunity: Opportunity;
  onEdit?: (opportunity: Opportunity) => void;
  className?: string;
}

export const DraggableOpportunityCard = ({ 
  opportunity, 
  onEdit, 
  className = "" 
}: DraggableOpportunityCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get creation date and days since creation
  const createdDate = opportunity.created_at || new Date().toISOString();
  const daysSinceCreation = Math.floor((new Date().getTime() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing ${className} ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and edit button */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm flex-1 mr-2">
              {opportunity.name}
            </h4>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(opportunity);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Stage Chip and Probability */}
          <div className="flex items-center gap-2">
            <StageChip 
              stage={opportunity.stage}
              daysInStage={opportunity.days_in_stage}
              isOverdue={opportunity.is_overdue}
            />
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {Math.round((STAGE_PROBABILITIES[opportunity.stage] || 0) * 100)}%
            </Badge>
            <Badge variant="outline" className="text-xs">
              Perf {computeCumulativePerformanceScore(opportunity)}
            </Badge>
          </div>
          
          {/* Amount */}
          <div className="text-lg font-bold text-primary">
            {formatCurrency(opportunity.amount || 0, opportunity.currency)}
          </div>
          
          {/* Stage Progress Bar */}
          <StageProgressBar
            currentStage={opportunity.stage}
            stageEnteredAt={opportunity.stage_entered_at}
            daysInStage={opportunity.days_in_stage}
            isOverdue={opportunity.is_overdue}
          />
          
          {/* Next Step row */}
          <div className="text-sm">
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-xs">Next Step</span>
              <p className="font-medium truncate text-xs mt-0.5">
                {opportunity.next_step_title || 'No next step defined'}
              </p>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {formatDate(createdDate)} • {daysSinceCreation} days
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};