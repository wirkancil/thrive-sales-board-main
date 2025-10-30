import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Removed Select imports as we no longer use a dropdown for loss reasons
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LossReason {
  id: string;
  label: string;
}

interface MarkLostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityName: string;
  onSuccess: () => void;
}

export function MarkLostModal({ 
  open, 
  onOpenChange, 
  opportunityId, 
  opportunityName,
  onSuccess 
}: MarkLostModalProps) {
  const [loading, setLoading] = useState(false);
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [notes, setNotes] = useState("");

  // Fallback suggestion labels if DB has none
  const FALLBACK_REASON_LABELS = [
    'Budget constraints',
    'Timeline mismatch',
    'Chose competitor',
    'No decision',
    'Scope changed',
    'Requirements not met'
  ];

  const NOTE_SUGGESTIONS = [
    'Budget unacceptable',
    'Timeline not feasible',
    'Selected competitor after evaluation',
    'Internal priorities shifted',
    'No executive sponsor',
    'Feature gap vs requirements',
    'Pricing outside approval threshold'
  ];

  // Fetch loss_reasons untuk memperkaya saran label; fallback ke daftar lokal
  useEffect(() => {
    if (open) {
      fetchLossReasons();
    }
  }, [open]);

  const fetchLossReasons = async () => {
    try {
      const { data, error } = await supabase
        .from('loss_reasons')
        .select('id, label')
        .eq('active', true)
        .order('label');

      if (error) throw error;
      setLossReasons(data || []);
    } catch (error) {
      console.error('Error fetching loss reasons:', error);
      // Biarkan menggunakan FALLBACK_REASON_LABELS tanpa menampilkan error ke user
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ 
          status: 'lost',
          stage: 'Closed Lost',
          expected_close_date: new Date().toISOString().split('T')[0],
          // Keep the payload minimal to avoid generated columns issues
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (error) throw error;

      // Also update pipeline items to reflect lost status
      const { error: pipelineError } = await supabase
        .from('pipeline_items')
        .update({ 
          status: 'lost'
        })
        .eq('opportunity_id', opportunityId);

      if (pipelineError) throw pipelineError;

      // Create activity record for the loss
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          opportunity_id: opportunityId,
          subject: `Opportunity marked as lost`,
          description: notes.trim() || `${opportunityName} was marked as lost`,
          status: 'completed',
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (activityError) {
        console.warn('Warning: Failed to create activity record:', activityError);
      }

      toast.success('Opportunity marked as lost');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error marking opportunity as lost:', error);
      toast.error('Failed to mark opportunity as lost');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opportunity">Opportunity</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {opportunityName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lossReason">Loss Reason</Label>
            {/* Notes textarea placed at the top and renamed */}
            <div className="space-y-2">
              <Label htmlFor="notes">Loss Reason Note</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add loss reason details on separate lines; tap suggestions to add a new line."
                rows={3}
              />
            </div>
            {/* Quick tap suggestions that append as new note lines */}
            <div className="space-y-2 mt-3">
              <Label className="text-sm">Suggestions (tap to insert line):</Label>
              <div className="flex flex-wrap gap-2">
                {(lossReasons.length > 0 ? lossReasons.map(r => r.label) : FALLBACK_REASON_LABELS).map((label, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Always append suggestion label as a new line in notes, avoiding duplicates
                      const existing = notes
                        .split(/\r?\n/)
                        .map(l => l.trim())
                        .filter(Boolean);
                      if (existing.includes(label)) return;
                      const prefix = notes.trim().length > 0 ? "\n" : "";
                      setNotes((notes.trim() + prefix + label).trim());
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Note prompts to quickly add plain-text details */}
          <div className="space-y-2 mb-4">
            <Label className="text-sm">Note prompts (tap to insert):</Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_SUGGESTIONS.map((s, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const lines = notes.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                    if (lines.includes(s)) return;
                    const prefix = notes.trim().length > 0 ? "\n" : "";
                    setNotes((notes.trim() + prefix + s).trim());
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Marking as Lost..." : "Mark as Lost"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}