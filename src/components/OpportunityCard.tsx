import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, ChevronRight, Clock, X, Package, FileText } from "lucide-react";
import { STAGE_PROBABILITIES, formatDate, getCountdown, computeCumulativePerformanceScore } from "@/lib/constants";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import AdvanceStageModal from "@/components/modals/AdvanceStageModal";
import LossReasonModal from "@/components/modals/LossReasonModal";
import ActivityLogModal from "@/components/modals/ActivityLogModal";
import { ConvertToProjectModal } from "@/components/modals/ConvertToProjectModal";
import OpportunityDetailModal from "@/components/modals/OpportunityDetailModal";
import QualificationModal from "@/components/modals/QualificationModal";

interface OpportunityCardProps {
  opportunity: {
    id: string;
    name: string;
    amount?: number | null;
    currency?: string;
    stage?: string;
    next_step_title?: string;
    next_step_due_date?: string;
    probability?: number;
    created_at?: string;
    is_won?: boolean;
  };
  onEdit?: (opportunity: any) => void;
  className?: string;
}

// Next Step Button Component
const NextStepButton = ({ opportunityId, stage, onAdvance }: { opportunityId: string; stage?: string; onAdvance?: (opportunity: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [fullOpportunity, setFullOpportunity] = useState<any>(null);

  const handleNextStep = async () => {
    setLoading(true);
    try {
      // Fetch opportunity details with related data
      const { data: oppData, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          customer:organizations!customer_id(name),
          current_stage:pipeline_stages!stage_id(name, sort_order),
          pipeline:pipelines!pipeline_id(id, name)
        `)
        .eq('id', opportunityId)
        .maybeSingle();

      if (oppError) throw oppError;
      
      if (!oppData) {
        toast.error('Opportunity not found');
        return;
      }

      // Get all stages for the pipeline
      const { data: stagesData, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('name, sort_order, is_won, is_lost')
        .eq('pipeline_id', oppData.pipeline_id)
        .eq('is_active', true)
        .order('sort_order');

      if (stagesError) throw stagesError;

      // Get owner info separately
      const { data: ownerData } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', oppData.owner_id)
        .maybeSingle();

      // Find next stage
      const currentStage = oppData.current_stage;
      const allStages = stagesData || [];
      const nextStage = allStages.find((stage: any) => 
        stage.sort_order === (currentStage?.sort_order || 0) + 1
      );

      if (!nextStage) {
        toast.info('Opportunity is already at final stage');
        return;
      }

      // Check if it's a closed stage
      if (nextStage.is_won || nextStage.is_lost) {
        // For lost stages, show loss reason modal
        if (nextStage.is_lost) {
          setShowLossModal(true);
          return;
        }
        
        // For won stages, advance directly
        const { data, error } = await supabase.rpc('advance_opportunity_stage', {
          opportunity_id: opportunityId
        });

        if (error) throw error;

        if (data) {
          toast.success('Opportunity won!');
          onAdvance?.({ id: opportunityId });
        }
        return;
      }

      // Prepare opportunity data for modal
      const modalOpportunity = {
        id: oppData.id,
        name: oppData.name,
        amount: oppData.amount,
        currency: oppData.currency,
        customer_name: oppData.customer?.name,
        expected_close_date: oppData.expected_close_date,
        owner_name: ownerData?.full_name,
        probability: oppData.probability,
        current_stage: currentStage?.name,
        next_stage: nextStage?.name,
        stage_details: {
          qualification: oppData.qualification_details,
          approachDiscovery: oppData.approach_discovery_details,
          presentationPoc: oppData.presentation_poc_details
        }
      };

      setFullOpportunity(modalOpportunity);
      setShowAdvanceModal(true);
    } catch (error) {
      console.error('Error preparing stage advancement:', error);
      toast.error('Failed to load opportunity details');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowAdvanceModal(false);
    setFullOpportunity(null);
  };

  const handleModalUpdate = () => {
    onAdvance?.({ id: opportunityId });
    handleModalClose();
  };

  const handleLossModalUpdate = () => {
    onAdvance?.({ id: opportunityId });
    setShowLossModal(false);
  };

  const handleActivityModalUpdate = () => {
    // Just close the modal, no need to refresh the whole pipeline
    setShowActivityModal(false);
  };

  return (
    <>
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 px-3 text-xs flex-1"
          onClick={handleNextStep}
          disabled={loading}
        >
          {loading ? 'Loading...' : (
            <>
              Next Step
              <ChevronRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setShowActivityModal(true)}
          title="Log Activity"
        >
          <Clock className="h-3 w-3" />
        </Button>

        {stage === 'Proposal/Negotiation' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setShowLossModal(true)}
            title="Mark as Lost"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AdvanceStageModal
        isOpen={showAdvanceModal}
        onClose={handleModalClose}
        opportunity={fullOpportunity}
        onUpdate={handleModalUpdate}
      />
      
      <LossReasonModal
        isOpen={showLossModal}
        onClose={() => setShowLossModal(false)}
        opportunityId={opportunityId}
        opportunityName={fullOpportunity?.name || 'Opportunity'}
        onUpdate={handleLossModalUpdate}
      />

      <ActivityLogModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        opportunityId={opportunityId}
        opportunityName={fullOpportunity?.name}
        onActivityAdded={handleActivityModalUpdate}
      />
    </>
  );
};

export const OpportunityCard = ({ opportunity, onEdit, className = "" }: OpportunityCardProps) => {
  const { formatCurrency } = useCurrencyFormatter();
  const stageProbability = opportunity.stage ? STAGE_PROBABILITIES[opportunity.stage] || 0 : 0;
  const displayProbability = stageProbability; // Selalu gunakan progres kumulatif tahap
  const performanceScore = computeCumulativePerformanceScore(opportunity);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  
  // Debug logging
  console.log('OpportunityCard:', {
    id: opportunity.id,
    name: opportunity.name,
    stage: opportunity.stage,
    isProspecting: opportunity.stage === 'Prospecting'
  });
  
  // Check if opportunity already has a project
  useEffect(() => {
    const checkProject = async () => {
      if (opportunity.is_won || opportunity.stage === 'Closed Won') {
        const { data } = await supabase
          .from('projects')
          .select('id')
          .eq('opportunity_id', opportunity.id)
          .maybeSingle();
        
        setHasProject(!!data);
      }
    };
    
    checkProject();
  }, [opportunity.id, opportunity.is_won, opportunity.stage]);
  
  // Get creation date and days since creation
  const createdDate = opportunity.created_at || new Date().toISOString();
  const daysSinceCreation = Math.floor((new Date().getTime() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24));
  
  const isWon = opportunity.is_won || opportunity.stage === 'Closed Won';
  
  return (
    <Card className={`hover:shadow-md transition-shadow group ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and probability pill */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm flex-1 mr-2">
              {opportunity.name}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {Math.round(displayProbability * 100)}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Perf {performanceScore}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(opportunity);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Amount */}
          <div className="text-xl font-bold text-primary">
            {formatCurrency(opportunity.amount || 0, opportunity.currency)}
          </div>
          
          {/* Next Step row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground">Next Step — </span>
              <span className="font-medium truncate">
                {opportunity.next_step_title || 'Qualification'}
              </span>
            </div>
            <div className="flex-shrink-0 ml-2 text-right">
              <div className="text-xs text-muted-foreground">
                {formatDate(createdDate)} • {daysSinceCreation} days
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowDetailModal(true)}
            title="Detail"
          >
            <FileText className="h-3 w-3" />
          </Button>
            {opportunity.stage !== 'Closed Won' && opportunity.stage !== 'Closed Lost' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-3 text-xs"
                onClick={() => {
                  if (opportunity.stage === 'Prospecting') {
                    setShowQualificationModal(true);
                  } else {
                    toast.info(`Next step untuk ${opportunity.stage} stage`);
                  }
                }}
                title="Next Step"
                data-action="next-step"
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                Next Step
              </Button>
            )}
            {isWon && !hasProject && (
              <Button 
                variant="default" 
                size="sm" 
                className="h-7 px-3 text-xs"
                onClick={() => setShowConvertModal(true)}
              >
                <Package className="h-3 w-3 mr-1" />
                Convert to Project
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {showConvertModal && (
        <ConvertToProjectModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          opportunityId={opportunity.id}
          opportunityName={opportunity.name}
          opportunityAmount={opportunity.amount || 0}
          opportunityCurrency={opportunity.currency || 'USD'}
        />
      )}
      
      {showDetailModal && (
        <OpportunityDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          opportunityId={opportunity.id}
        />
      )}

      {showQualificationModal && (
        <QualificationModal
          isOpen={showQualificationModal}
          onClose={() => setShowQualificationModal(false)}
          opportunityId={opportunity.id}
          onSave={() => {
            setShowQualificationModal(false);
            onEdit?.(opportunity);
          }}
        />
      )}
    </Card>
  );
};