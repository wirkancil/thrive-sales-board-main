import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, DollarSign } from "lucide-react";

type PipelineStage = "Lead" | "Contacted" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
type DealStatus = "hot" | "warm" | "cold";

interface NewDeal {
  company: string;
  value: string;
  stage: PipelineStage;
  status: DealStatus;
  assignedRep: string;
  contactPerson: string;
  contactEmail: string;
  notes: string;
}

interface AddDealModalProps {
  onAddDeal: (deal: Omit<NewDeal, 'value'> & { value: number }) => void;
  reps: string[];
}

const stages: PipelineStage[] = ["Lead", "Contacted", "Proposal Sent", "Negotiation", "Won", "Lost"];

export default function AddDealModal({ onAddDeal, reps }: AddDealModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<NewDeal>({
    company: '',
    value: '',
    stage: 'Lead',
    status: 'warm',
    assignedRep: reps[0] || '',
    contactPerson: '',
    contactEmail: '',
    notes: ''
  });

  const handleSubmit = () => {
    if (newDeal.company && newDeal.value) {
        onAddDeal({
        company: newDeal.company,
        value: parseFloat(newDeal.value),
        stage: newDeal.stage,
        status: newDeal.status,
        assignedRep: newDeal.assignedRep,
        contactPerson: newDeal.contactPerson,
        contactEmail: newDeal.contactEmail,
        notes: newDeal.notes
      });
      
      // Reset form
      setNewDeal({
        company: '',
        value: '',
        stage: 'Lead',
        status: 'warm',
        assignedRep: reps[0] || '',
        contactPerson: '',
        contactEmail: '',
        notes: ''
      });
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    // Reset form on cancel
    setNewDeal({
      company: '',
      value: '',
      stage: 'Lead',
      status: 'warm',
      assignedRep: reps[0] || '',
      contactPerson: '',
      contactEmail: '',
      notes: ''
    });
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow px-4 py-2 rounded-md">
          ➕ Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md animate-in zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Deal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 pt-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="company"
              value={newDeal.company}
              onChange={(e) => setNewDeal(prev => ({...prev, company: e.target.value}))}
              placeholder="Enter company name"
              className="w-full"
            />
          </div>
          
          {/* Deal Value */}
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-medium">
              Deal Value <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="value"
                type="number"
                value={newDeal.value}
                onChange={(e) => setNewDeal(prev => ({...prev, value: e.target.value}))}
                placeholder="0.00"
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Stage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stage</Label>
            <Select value={newDeal.stage} onValueChange={(value) => setNewDeal(prev => ({...prev, stage: value as PipelineStage}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={newDeal.status} onValueChange={(value) => setNewDeal(prev => ({...prev, status: value as DealStatus}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Hot
                  </div>
                </SelectItem>
                <SelectItem value="warm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    Warm
                  </div>
                </SelectItem>
                <SelectItem value="cold">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Cold
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assigned To</Label>
            <Select value={newDeal.assignedRep} onValueChange={(value) => setNewDeal(prev => ({...prev, assignedRep: value}))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reps
                  .filter(rep => rep && rep.trim() !== '')
                  .map(rep => (
                    <SelectItem key={rep} value={rep}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(rep)}
                          </AvatarFallback>
                        </Avatar>
                        {rep}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="text-sm font-medium">Contact Person</Label>
            <Input 
              id="contactPerson"
              value={newDeal.contactPerson}
              onChange={(e) => setNewDeal(prev => ({...prev, contactPerson: e.target.value}))}
              placeholder="Enter contact person name"
              className="w-full"
            />
          </div>
          
          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</Label>
            <Input 
              id="contactEmail"
              type="email"
              value={newDeal.contactEmail}
              onChange={(e) => setNewDeal(prev => ({...prev, contactEmail: e.target.value}))}
              placeholder="Enter contact email"
              className="w-full"
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea 
              id="notes"
              value={newDeal.notes}
              onChange={(e) => setNewDeal(prev => ({...prev, notes: e.target.value}))}
              placeholder="Add any additional notes about this deal..."
              className="w-full resize-none"
              rows={3}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button variant="outline" onClick={handleCancel} className="sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!newDeal.company || !newDeal.value}
            className="sm:w-auto"
          >
            Save Deal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}