import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LossReason {
  id: string;
  label: string;
}

interface LossReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityName: string;
  onUpdate: () => void;
}

export default function LossReasonModal({ 
  isOpen, 
  onClose, 
  opportunityId, 
  opportunityName, 
  onUpdate 
}: LossReasonModalProps) {
  const [loading, setLoading] = useState(false);
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [comments, setComments] = useState("");

  // Fetch loss reasons dari DB; fallback ke daftar statis jika gagal/ kosong
  useEffect(() => {
    const STATIC_REASONS = [
      'Budget constraints',
      'Timeline mismatch',
      'Chose competitor',
      'No decision',
      'Scope changed',
      'Requirements not met',
      'Feature gap vs requirements',
      'Pricing outside approval threshold'
    ];

    const fetchLossReasons = async () => {
      try {
        const { data, error } = await supabase
          .from('loss_reasons')
          .select('id, label')
          .eq('active', true)
          .order('label');
        if (error) throw error;
        const rows = data || [];
        if (!rows.length) {
          setLossReasons(
            STATIC_REASONS.map((label) => ({ id: `static-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label }))
          );
        } else {
          setLossReasons(rows);
        }
      } catch (err) {
        console.error('Error fetching loss reasons:', err);
        setLossReasons(
          STATIC_REASONS.map((label) => ({ id: `static-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label }))
        );
      }
    };

    if (isOpen) {
      fetchLossReasons();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonId("");
      setComments("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      toast.error('Please select a loss reason');
      return;
    }

    setLoading(true);
    try {
      // Update opportunity status to lost
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          status: 'lost',
          stage: 'Closed Lost',
          lost_reason_id: selectedReasonId.startsWith('static-') ? null : selectedReasonId,
          expected_close_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (updateError) throw updateError;

      // Sinkronkan status pipeline item
      const { error: pipelineError } = await supabase
        .from('pipeline_items')
        .update({ status: 'lost' })
        .eq('opportunity_id', opportunityId);

      if (pipelineError) throw pipelineError;

      // Log activity for the loss
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          opportunity_id: opportunityId,
          subject: 'Opportunity marked as lost',
          description: comments || `Opportunity lost. Reason: ${lossReasons.find(r => r.id === selectedReasonId)?.label}`,
          status: 'completed',
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating activity:', activityError);
        // Don't fail the whole operation if activity creation fails
      }

      toast.success('Opportunity marked as lost');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error marking opportunity as lost:', error);
      toast.error('Failed to mark opportunity as lost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Mark as Lost
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Opportunity</p>
            <p className="text-sm text-muted-foreground">{opportunityName}</p>
          </div>

          {/* Loss Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="lossReason" className="text-sm font-medium">
              Loss Reason <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={selectedReasonId} 
              onValueChange={setSelectedReasonId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {lossReasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional context about why this opportunity was lost..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedReasonId || loading}
            variant="destructive"
            className="sm:w-auto"
          >
            {loading ? 'Marking as Lost...' : 'Mark as Lost'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}