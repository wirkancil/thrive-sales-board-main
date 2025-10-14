import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DraggableOpportunityCard } from "@/components/DraggableOpportunityCard";
import { formatCurrency } from "@/lib/constants";

interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
  default_probability: number;
}

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
}

interface DroppableStageColumnProps {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onEditOpportunity: (opportunity: Opportunity) => void;
}

export const DroppableStageColumn = ({ 
  stage, 
  opportunities, 
  onEditOpportunity 
}: DroppableStageColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const stageValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

  return (
    <Card className={`flex-shrink-0 w-80 transition-colors ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{stage.name}</CardTitle>
          <Badge variant="secondary">
            {opportunities.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(stageValue)}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div 
          ref={setNodeRef}
          className={`space-y-3 min-h-[500px] p-2 bg-muted/20 rounded-md transition-colors ${
            isOver ? 'bg-primary/10' : ''
          }`}
        >
          <SortableContext 
            items={opportunities.map(opp => opp.id)} 
            strategy={verticalListSortingStrategy}
          >
            {opportunities.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <p className="text-sm">No opportunities</p>
              </div>
            ) : (
              opportunities.map((opportunity) => (
                <DraggableOpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onEdit={onEditOpportunity}
                />
              ))
            )}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
};