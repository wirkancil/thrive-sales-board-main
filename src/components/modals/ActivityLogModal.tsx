import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId?: string;
  opportunityName?: string;
  onActivityAdded?: () => void;
}

export default function ActivityLogModal({ 
  isOpen, 
  onClose, 
  opportunityId, 
  opportunityName,
  onActivityAdded
}: ActivityLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    due_at: '',
    status: 'open' as 'open' | 'completed'
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: '',
        description: '',
        due_at: '',
        status: 'open'
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      toast.error('Please enter an activity subject');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          opportunity_id: opportunityId,
          subject: formData.subject,
          description: formData.description || null,
          due_at: formData.due_at ? new Date(formData.due_at).toISOString() : null,
          status: formData.status,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Activity logged successfully');
      onActivityAdded?.();
      onClose();
    } catch (error) {
      console.error('Error logging activity:', error);
      toast.error('Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Activity
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {opportunityName && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Opportunity</p>
              <p className="text-sm text-muted-foreground">{opportunityName}</p>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Activity Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g., Follow-up call, Demo scheduled, Meeting notes"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about this activity..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueAt" className="text-sm font-medium">
              Due Date (Optional)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dueAt"
                type="datetime-local"
                value={formData.due_at}
                onChange={(e) => setFormData(prev => ({ ...prev, due_at: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'open' | 'completed' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.subject.trim() || loading}
            className="sm:w-auto"
          >
            {loading ? 'Logging...' : 'Log Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}