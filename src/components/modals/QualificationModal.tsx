import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";

interface QualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  onSave: () => void;
}

const QUALIFICATION_SUGGESTIONS = [
  "Need",
  "Budget/Timeline", 
  "Buying Roles Known"
];

export default function QualificationModal({ isOpen, onClose, opportunityId, onSave }: QualificationModalProps) {
  const [qualificationDetails, setQualificationDetails] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [opportunity, setOpportunity] = useState<any>(null);

  // Fetch opportunity data when modal opens
  const fetchOpportunity = async () => {
    if (!opportunityId) return;
    
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          name,
          amount,
          currency,
          probability,
          owner_id,
          customer_id,
          qualification_details
        `)
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      // Create opportunity object with additional fields
      const opportunityData: any = { ...data };

      // Fetch owner information separately
      if (data.owner_id) {
        const { data: ownerData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', data.owner_id)
          .single();

        opportunityData.owner_name = ownerData?.full_name || '';
      }

      // Fetch customer information
      if (data.customer_id) {
        const { data: customerData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', data.customer_id)
          .single();

        opportunityData.customer_name = customerData?.name || '';
      }

      setOpportunity(opportunityData);
      // Prefill text area dengan qualification_details bila sudah ada
      if (opportunityData.qualification_details) {
        setQualificationDetails(opportunityData.qualification_details);
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast.error('Failed to load opportunity data');
    }
  };

  // Fetch opportunity when modal opens
  if (isOpen && !opportunity) {
    fetchOpportunity();
  }

  const handleSuggestionToggle = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleSuggestionInsert = (suggestion: string) => {
    const currentText = qualificationDetails;
    const newText = currentText ? `${currentText}\n• ${suggestion}` : `• ${suggestion}`;
    setQualificationDetails(newText);
  };

  const handleSave = async () => {
    if (!opportunity) return;
    
    if (!qualificationDetails.trim()) {
      toast.error('Please enter qualification details');
      return;
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setIsLoading(true);
    try {
      // Use the database function to advance opportunity stage
      const { error: advanceError } = await supabase.rpc('advance_opportunity_stage', {
        opportunity_id: opportunityId
      });

      if (advanceError) throw advanceError;

      // Update next step details
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          next_step_title: 'Qualification Review',
          next_step_due_date: dueDate,
          qualification_details: qualificationDetails.trim()
        })
        .eq('id', opportunityId);

      if (updateError) throw updateError;

      toast.success('Opportunity advanced to Qualification stage');
      onSave();
      onClose();
      
      // Reset form
      setQualificationDetails("");
      setDueDate("");
      setSelectedSuggestions([]);
    } catch (error) {
      console.error('Error advancing opportunity:', error);
      toast.error('Failed to advance opportunity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setQualificationDetails("");
    setDueDate("");
    setSelectedSuggestions([]);
    onClose();
  };

  if (!opportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Advance to Qualification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building className="h-4 w-4" />
                  <span>Opportunity</span>
                </div>
                <p className="font-medium">{opportunity.name}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Value</span>
                </div>
                <p className="font-medium">
                  {formatCurrency(opportunity.amount || 0, opportunity.currency)}
                </p>
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
                  <User className="h-4 w-4" />
                  <span>Owner</span>
                </div>
                <p className="font-medium">{opportunity.owner_name || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Qualification Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="qualificationDetails" className="text-sm font-medium">
                Qualification Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="qualificationDetails"
                value={qualificationDetails}
                onChange={(e) => setQualificationDetails(e.target.value)}
                placeholder="e.g., Confirm need; budget & timeline; buying roles known"
                className="min-h-[120px] resize-none mt-2"
                rows={5}
              />
              
              {/* Suggestions */}
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">Suggestions (tap to insert):</p>
                <div className="flex flex-wrap gap-2">
                  {QUALIFICATION_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-full"
                      onClick={() => handleSuggestionInsert(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2"
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !qualificationDetails.trim() || !dueDate}
            >
              {isLoading ? 'Saving...' : 'Save Next Step'}
            </Button>
          </div>

          {/* Save disabled note */}
          {(!qualificationDetails.trim() || !dueDate) && (
            <p className="text-xs text-muted-foreground text-center">
              Save disabled until details + date are filled
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}