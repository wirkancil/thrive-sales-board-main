import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PipelineItem {
  id: string;
  opportunity_name: string;
  amount: number;
  currency: string;
  probability: number;
  status: string;
  expected_close_date: string;
  cost_of_goods?: number;
  service_costs?: number;
  other_expenses?: number;
  loss_reason?: string;
}

interface EditPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineItem: PipelineItem | null;
  onUpdate: () => void;
}

export default function EditPipelineModal({ 
  isOpen, 
  onClose, 
  pipelineItem, 
  onUpdate 
}: EditPipelineModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [probability, setProbability] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [costOfGoods, setCostOfGoods] = useState("");
  const [serviceCosts, setServiceCosts] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [lossReason, setLossReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (pipelineItem && isOpen) {
      setAmount(pipelineItem.amount.toString());
      setExpectedDate(pipelineItem.expected_close_date);
      setProbability(pipelineItem.probability.toString());
      setStatus(pipelineItem.status);
      setCurrency(pipelineItem.currency);
      setCostOfGoods(pipelineItem.cost_of_goods?.toString() || "0");
      setServiceCosts(pipelineItem.service_costs?.toString() || "0");
      setOtherExpenses(pipelineItem.other_expenses?.toString() || "0");
      setLossReason(pipelineItem.loss_reason || "");
    }
  }, [pipelineItem, isOpen]);

  const handleSubmit = async () => {
    // Enhanced validation
    if (!pipelineItem || !expectedDate || !status) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate amount for won status
    if (status === "won" && !amount) {
      toast({
        title: "Error",
        description: "Amount is required for won deals",
        variant: "destructive",
      });
      return;
    }

    // Validate loss reason for lost status
    if (status === "lost" && !lossReason.trim()) {
      toast({
        title: "Error",
        description: "Loss reason is required for lost deals",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        expected_close_date: expectedDate,
        probability: probability ? Math.min(100, Math.max(0, parseFloat(probability))) : 0,
        status: status as any,
        currency: currency as any
      };

      // Add amount and COGS for won deals
      if (status === "won") {
        updateData.amount = parseFloat(amount);
        updateData.cost_of_goods = costOfGoods ? parseFloat(costOfGoods) : 0;
        updateData.service_costs = serviceCosts ? parseFloat(serviceCosts) : 0;
        updateData.other_expenses = otherExpenses ? parseFloat(otherExpenses) : 0;
        updateData.loss_reason = null; // Clear loss reason for won deals
      }

      // Add loss reason for lost deals
      if (status === "lost") {
        updateData.loss_reason = lossReason;
        // Keep existing amount for lost deals (read-only)
        updateData.amount = pipelineItem.amount;
      }

      const { error } = await supabase
        .from('pipeline_items')
        .update(updateData)
        .eq('id', pipelineItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pipeline item updated successfully",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating pipeline item:', error);
      toast({
        title: "Error",
        description: "Failed to update pipeline item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!pipelineItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Edit Pipeline Item</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Opportunity: {pipelineItem.opportunity_name}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 pt-4 overflow-y-auto flex-1 pr-2 -mr-2">
          {/* Status Selection - First Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Pipeline Status <span className="text-destructive">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Closed Won</SelectItem>
                <SelectItem value="lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields Based on Status */}
          {status === "won" && (
            <>
              {/* Amount - Editable for Won */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Final Amount <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                  <Input 
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-12"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* COGS Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold">Cost Breakdown</h4>
                
                {/* Cost of Goods */}
                <div className="space-y-2">
                  <Label htmlFor="cost_of_goods" className="text-sm font-medium">
                    Cost of Goods
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                    <Input 
                      id="cost_of_goods"
                      type="number"
                      value={costOfGoods}
                      onChange={(e) => setCostOfGoods(e.target.value)}
                      placeholder="0.00"
                      className="pl-12"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Service Costs */}
                <div className="space-y-2">
                  <Label htmlFor="service_costs" className="text-sm font-medium">
                    Service Costs
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                    <Input 
                      id="service_costs"
                      type="number"
                      value={serviceCosts}
                      onChange={(e) => setServiceCosts(e.target.value)}
                      placeholder="0.00"
                      className="pl-12"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Other Expenses */}
                <div className="space-y-2">
                  <Label htmlFor="other_expenses" className="text-sm font-medium">
                    Other Expenses
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                    <Input 
                      id="other_expenses"
                      type="number"
                      value={otherExpenses}
                      onChange={(e) => setOtherExpenses(e.target.value)}
                      placeholder="0.00"
                      className="pl-12"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Calculate and show margin */}
                {amount && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Margin:</span>
                      <span className="font-medium">
                        IDR {(parseFloat(amount) - (parseFloat(costOfGoods) || 0) - (parseFloat(serviceCosts) || 0) - (parseFloat(otherExpenses) || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {status === "lost" && (
            <>
              {/* Amount - Read-only for Lost */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Original Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                  <Input 
                    value={pipelineItem.amount.toLocaleString()}
                    className="pl-12 bg-muted text-muted-foreground"
                    disabled
                  />
                </div>
              </div>

              {/* Loss Reason - Required for Lost */}
              <div className="space-y-2">
                <Label htmlFor="loss_reason" className="text-sm font-medium">
                  Loss Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="loss_reason"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="Please explain why this deal was lost..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Common fields for both statuses */}
          {status && (
            <>
              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Close Date */}
              <div className="space-y-2">
                <Label htmlFor="expected_date" className="text-sm font-medium">
                  {status === "won" ? "Actual Close Date" : "Expected Close Date"} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="expected_date"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Win Probability */}
              <div className="space-y-2">
                <Label htmlFor="probability" className="text-sm font-medium">
                  {status === "won" ? "Final Probability" : "Probability"} (%)
                </Label>
                <Input 
                  id="probability"
                  type="number"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="pt-6 flex-shrink-0 border-t bg-background">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              loading || 
              !expectedDate || 
              !status || 
              (status === "won" && !amount) || 
              (status === "lost" && !lossReason.trim())
            }
          >
            {loading ? 'Updating...' : 'Close Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}