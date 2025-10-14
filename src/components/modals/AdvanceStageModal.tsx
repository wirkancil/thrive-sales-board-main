import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Calendar, DollarSign, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";

interface StageDetails {
  qualification?: string;
  approachDiscovery?: string;
  presentationPoc?: string;
  dueDate?: string;
}

interface Opportunity {
  id: string;
  name: string;
  amount?: number;
  currency?: string;
  customer_name?: string;
  expected_close_date?: string;
  owner_name?: string;
  probability?: number;
  current_stage?: string;
  next_stage?: string;
  stage_details?: StageDetails;
}

interface AdvanceStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onUpdate: () => void;
}

const STAGE_SUGGESTIONS = {
  qualification: [
    "Need confirmed",
    "Budget/Timeline established", 
    "Buying roles identified"
  ],
  approachDiscovery: [
    "Decision process mapped",
    "Decision criteria set",
    "Champion identified"
  ],
  presentationPoc: [
    "Demo/POC completed",
    "Success metrics agreed",
    "Readout scheduled"
  ]
};

const STAGE_LABELS = {
  qualification: "Qualification",
  approachDiscovery: "Approach/Discovery", 
  presentationPoc: "Presentation/POC"
};

export default function AdvanceStageModal({ isOpen, onClose, opportunity, onUpdate }: AdvanceStageModalProps) {
  const [loading, setLoading] = useState(false);
  const [showOpportunityDetails, setShowOpportunityDetails] = useState(false);
  const [showQualificationDetails, setShowQualificationDetails] = useState(false);
  const [showApproachDetails, setShowApproachDetails] = useState(false);
  
  const [stageDetails, setStageDetails] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && opportunity) {
      setStageDetails("");
      setDueDate("");
      setShowOpportunityDetails(false);
      setShowQualificationDetails(false);
      setShowApproachDetails(false);
    }
  }, [isOpen, opportunity]);

  if (!opportunity) return null;

  const currentStage = opportunity.current_stage?.toLowerCase().replace(/[^a-z]/g, '');
  const nextStage = opportunity.next_stage;
  const suggestions = STAGE_SUGGESTIONS[currentStage as keyof typeof STAGE_SUGGESTIONS] || [];
  const stageLabel = STAGE_LABELS[currentStage as keyof typeof STAGE_LABELS] || nextStage;

  // Determine which previous stage details to show
  const showQualification = currentStage === 'approachdiscovery' || currentStage === 'presentationpoc';
  const showApproachDiscovery = currentStage === 'presentationpoc';

  const handleSuggestionClick = (suggestion: string) => {
    const currentText = stageDetails;
    const newText = currentText 
      ? `${currentText}\n\n${suggestion}: ` 
      : `${suggestion}: `;
    setStageDetails(newText);
  };

  const handleSubmit = async () => {
    if (!stageDetails.trim()) {
      toast.error(`Please fill in the ${stageLabel} details`);
      return;
    }
    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    setLoading(true);
    try {
      // First advance the stage using the database function
      const { data: advanceResult, error: advanceError } = await supabase.rpc('advance_opportunity_stage', {
        opportunity_id: opportunity.id
      });

      if (advanceError) throw advanceError;

      if (!advanceResult) {
        toast.info("Opportunity is already at final stage");
        onClose();
        return;
      }

      // Then update with the stage-specific details
      const stageFieldMap: Record<string, string> = {
        'prospecting': 'qualification_details', // Moving TO qualification, so store qualification details
        'qualification': 'approach_discovery_details', // Moving TO approach/discovery
        'approachdiscovery': 'presentation_poc_details' // Moving TO presentation/poc
      };
      
      const stageDetailField = stageFieldMap[currentStage];
      const updateData: any = {
        next_step_due_date: dueDate,
        next_step_title: `${stageLabel} activities completed`,
        updated_at: new Date().toISOString()
      };

      // Only add stage details if we have a field mapping for this stage
      if (stageDetailField) {
        updateData[stageDetailField] = stageDetails;
      }

      const { error: updateError } = await supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', opportunity.id);

      if (updateError) throw updateError;

      toast.success(`Opportunity advanced to ${nextStage}!`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error advancing stage:', error);
      toast.error('Failed to advance opportunity stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Next Step — {stageLabel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Opportunity Details Section */}
          <div className="border rounded-lg">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 h-auto"
              onClick={() => setShowOpportunityDetails(!showOpportunityDetails)}
            >
              <span className="font-medium">
                {showOpportunityDetails ? 'Hide' : 'Show'} opportunity details
              </span>
              {showOpportunityDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showOpportunityDetails && (
              <div className="px-4 pb-4 border-t bg-muted/20">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building className="h-4 w-4" />
                      <span>Opportunity</span>
                    </div>
                    <p className="font-medium">{opportunity.name}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building className="h-4 w-4" />
                      <span>Customer</span>
                    </div>
                    <p className="font-medium">{opportunity.customer_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Amount ({opportunity.currency || 'USD'})</span>
                    </div>
                    <p className="font-medium">{formatCurrency(opportunity.amount || 0, opportunity.currency)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Expected Close</span>
                    </div>
                    <p className="font-medium">{formatDate(opportunity.expected_close_date)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span>Owner</span>
                    </div>
                    <p className="font-medium">{opportunity.owner_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>Probability</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {Math.round((opportunity.probability || 0) * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Previous Stage Details (if applicable) */}
          {showQualification && (
            <div className="border rounded-lg">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 h-auto"
                onClick={() => setShowQualificationDetails(!showQualificationDetails)}
              >
                <span className="font-medium">
                  {showQualificationDetails ? 'Hide' : 'Show'} qualification details
                </span>
                {showQualificationDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showQualificationDetails && (
                <div className="px-4 pb-4 border-t bg-muted/20">
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Qualification Details</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {opportunity.stage_details?.qualification || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Approach/Discovery Details (if applicable) */}
          {showApproachDiscovery && (
            <div className="border rounded-lg">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 h-auto"
                onClick={() => setShowApproachDetails(!showApproachDetails)}
              >
                <span className="font-medium">
                  {showApproachDetails ? 'Hide' : 'Show'} approach/discovery details
                </span>
                {showApproachDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showApproachDetails && (
                <div className="px-4 pb-4 border-t bg-muted/20">
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Approach/Discovery Details</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {opportunity.stage_details?.approachDiscovery || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Stage Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">Stage</Label>
              <Badge variant="secondary" className="text-sm">
                {stageLabel}
              </Badge>
            </div>

            {/* Stage Details */}
            <div className="space-y-2">
              <Label htmlFor="stageDetails" className="text-sm font-medium">
                {stageLabel} Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="stageDetails"
                value={stageDetails}
                onChange={(e) => setStageDetails(e.target.value)}
                placeholder={`e.g., ${suggestions[0]?.toLowerCase()}; ${suggestions[1]?.toLowerCase()}; ${suggestions[2]?.toLowerCase()}`}
                className="min-h-[100px] resize-none"
                rows={4}
              />
              
              {/* Suggestions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Suggestions (tap to insert):</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!stageDetails.trim() || !dueDate || loading}
            className="sm:w-auto"
          >
            {loading ? 'Saving...' : 'Save Next Step'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}