import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/useProjects";
import { Plus, X } from "lucide-react";

interface ConvertToProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityName: string;
  opportunityAmount: number;
  opportunityCurrency: string;
}

interface Installment {
  percentage: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
}

export const ConvertToProjectModal = ({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  opportunityAmount,
  opportunityCurrency,
}: ConvertToProjectModalProps) => {
  const { createProject } = useProjects();
  
  const [formData, setFormData] = useState({
    name: opportunityName,
    po_number: "",
    po_date: "",
    po_amount: opportunityAmount,
    payment_type: "CBD" as 'CBD' | 'TOP' | 'Installments',
    cbd_percentage: 100,
    cbd_due_date: "",
    top_days: 30,
    top_due_date: "",
    notes: "",
    currency: opportunityCurrency,
  });

  const [installments, setInstallments] = useState<Installment[]>([
    { percentage: 50, due_date: "", amount: opportunityAmount * 0.5, status: 'pending' },
    { percentage: 50, due_date: "", amount: opportunityAmount * 0.5, status: 'pending' },
  ]);

  const handleSubmit = () => {
    const projectData: any = {
      name: formData.name,
      opportunity_id: opportunityId,
      po_number: formData.po_number,
      po_date: formData.po_date || null,
      po_amount: formData.po_amount,
      payment_type: formData.payment_type,
      currency: formData.currency,
      notes: formData.notes,
    };

    if (formData.payment_type === 'CBD') {
      projectData.cbd_percentage = formData.cbd_percentage;
      projectData.cbd_due_date = formData.cbd_due_date || null;
    } else if (formData.payment_type === 'TOP') {
      projectData.top_days = formData.top_days;
      projectData.top_due_date = formData.top_due_date || null;
    } else if (formData.payment_type === 'Installments') {
      projectData.installments = installments;
    }

    createProject(projectData);
    onOpenChange(false);
  };

  const addInstallment = () => {
    setInstallments([...installments, { 
      percentage: 0, 
      due_date: "", 
      amount: 0, 
      status: 'pending' 
    }]);
  };

  const removeInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const updateInstallment = (index: number, field: keyof Installment, value: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'percentage') {
      updated[index].amount = (value / 100) * formData.po_amount;
    }
    
    setInstallments(updated);
  };

  const totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
  const isValid = formData.name && formData.po_number && formData.po_date && 
    (formData.payment_type !== 'Installments' || totalPercentage === 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="po_number">PO Number *</Label>
              <Input
                id="po_number"
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="po_date">PO Date *</Label>
              <Input
                id="po_date"
                type="date"
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="po_amount">PO Amount</Label>
              <Input
                id="po_amount"
                type="number"
                value={formData.po_amount}
                onChange={(e) => setFormData({ ...formData, po_amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_type">Payment Type</Label>
            <Select
              value={formData.payment_type}
              onValueChange={(value: any) => setFormData({ ...formData, payment_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CBD">Cash Before Delivery</SelectItem>
                <SelectItem value="TOP">Terms of Payment</SelectItem>
                <SelectItem value="Installments">Installments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_type === 'CBD' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cbd_percentage">CBD Percentage (%)</Label>
                <Input
                  id="cbd_percentage"
                  type="number"
                  value={formData.cbd_percentage}
                  onChange={(e) => setFormData({ ...formData, cbd_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cbd_due_date">Due Date</Label>
                <Input
                  id="cbd_due_date"
                  type="date"
                  value={formData.cbd_due_date}
                  onChange={(e) => setFormData({ ...formData, cbd_due_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {formData.payment_type === 'TOP' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="top_days">Payment Terms (Days)</Label>
                <Input
                  id="top_days"
                  type="number"
                  value={formData.top_days}
                  onChange={(e) => setFormData({ ...formData, top_days: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="top_due_date">Due Date</Label>
                <Input
                  id="top_due_date"
                  type="date"
                  value={formData.top_due_date}
                  onChange={(e) => setFormData({ ...formData, top_due_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {formData.payment_type === 'Installments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Installment Schedule</Label>
                <Button type="button" size="sm" variant="outline" onClick={addInstallment}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {installments.map((inst, idx) => (
                <div key={idx} className="flex gap-2 items-end border p-3 rounded-lg">
                  <div className="flex-1">
                    <Label>Percentage (%)</Label>
                    <Input
                      type="number"
                      value={inst.percentage}
                      onChange={(e) => updateInstallment(idx, 'percentage', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Amount</Label>
                    <Input type="number" value={inst.amount.toFixed(2)} readOnly />
                  </div>
                  <div className="flex-1">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={inst.due_date}
                      onChange={(e) => updateInstallment(idx, 'due_date', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeInstallment(idx)}
                    disabled={installments.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-muted-foreground">
                Total: {totalPercentage}% {totalPercentage !== 100 && <span className="text-destructive">(Must equal 100%)</span>}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid}>
              Create Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
