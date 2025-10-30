import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
interface Opportunity {
  id: string;
  name: string;
  amount: number;
  customer_name?: string;
}
interface AddPipelineModalProps {
  onAddPipeline: () => void;
}
export default function AddPipelineModal({
  onAddPipeline
}: AddPipelineModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>("");
  const [quotationNo, setQuotationNo] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [costOfGoods, setCostOfGoods] = useState<string>("");
  const [serviceCosts, setServiceCosts] = useState<string>("");
  const [otherExpenses, setOtherExpenses] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (isOpen) {
      fetchOpportunities();
    }
  }, [isOpen]);
  useEffect(() => {
    if (expectedDate) {
      const date = new Date(expectedDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      let q = "";
      if (month <= 3) q = "Q1";else if (month <= 6) q = "Q2";else if (month <= 9) q = "Q3";else q = "Q4";
      setQuarter(`${q} ${year}`);
    } else {
      setQuarter("");
    }
  }, [expectedDate]);
  const fetchOpportunities = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('opportunities').select(`
          id, 
          name, 
          amount,
          organizations!opportunities_customer_id_fkey(name)
        `).eq('status', 'open').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      const formattedOpportunities = data.map(opp => ({
        id: opp.id,
        name: opp.name || '[No Name]',
        amount: opp.amount || 0,
        customer_name: opp.organizations?.name || 'Unknown Customer'
      }));
      setOpportunities(formattedOpportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive"
      });
    }
  };
  const handleOpportunitySelect = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (opportunity) {
      setAmount(opportunity.amount.toString());
    }
  };
  const handleSubmit = async () => {
    if (!selectedOpportunity || !amount || !expectedDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Check if pipeline item already exists for this opportunity
      const {
        data: existingItem,
        error: existingError
      } = await supabase.from('pipeline_items').select('id').eq('opportunity_id', selectedOpportunity).maybeSingle();
      
      if (existingError) {
        console.error('Error checking existing pipeline items:', existingError);
        toast({
          title: "Error",
          description: "Failed to check existing pipeline items",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      if (existingItem) {
        toast({
          title: "Error",
          description: "A pipeline item already exists for this opportunity",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Get default pipeline
      const {
        data: pipelineData,
        error: pipelineError
      } = await supabase.from('pipelines').select('id').eq('is_active', true).limit(1).single();
      if (pipelineError || !pipelineData) {
        throw new Error('No active pipeline found');
      }

      // Get current user
      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Update opportunity stage to "Proposal/Negotiation" directly (match enum)
      const {
        error: opportunityUpdateError
      } = await supabase.from('opportunities').update({
        stage: 'Proposal/Negotiation',
        probability: 0.80,
        // Proposal/Negotiation probability
        updated_at: new Date().toISOString()
      }).eq('id', selectedOpportunity);
      if (opportunityUpdateError) throw opportunityUpdateError;
      const {
        error
      } = await supabase.from('pipeline_items').insert({
        opportunity_id: selectedOpportunity,
        amount: parseFloat(amount),
        expected_close_date: expectedDate,
        status: 'negotiation' as any,
        // Direct to negotiation status
        created_by: userData.user.id,
        pipeline_id: pipelineData.id,
        quotation_no: quotationNo || null,
        cost_of_goods: costOfGoods ? parseFloat(costOfGoods) : 0,
        service_costs: serviceCosts ? parseFloat(serviceCosts) : 0,
        other_expenses: otherExpenses ? parseFloat(otherExpenses) : 0
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Pipeline item created successfully"
      });
      onAddPipeline(); // Refresh pipeline management data

      // Also refresh the opportunities page by dispatching a custom event
      window.dispatchEvent(new CustomEvent('pipelineItemAdded'));
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating pipeline item:', error);
      toast({
        title: "Error",
        description: "Failed to create pipeline item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setSelectedOpportunity("");
    setQuotationNo("");
    setAmount("");
    setExpectedDate("");
    setQuarter("");
    setCostOfGoods("");
    setServiceCosts("");
    setOtherExpenses("");
  };
  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Pipeline
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Pipeline</DialogTitle>
          <DialogDescription>
            Create a new pipeline item from an existing opportunity.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 max-h-[60vh]">
          {/* Opportunity Selection */}
          <div className="space-y-2">
            <Label htmlFor="opportunity" className="text-sm font-medium">
              Opportunity
            </Label>
            <Select value={selectedOpportunity} onValueChange={handleOpportunitySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select from opportunity" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-[200px] overflow-y-auto">
                {opportunities.filter(opportunity => opportunity.id && opportunity.id.trim() !== '' && opportunity.name && opportunity.name.trim() !== '').map(opportunity => <SelectItem key={opportunity.id} value={opportunity.id} className="bg-background hover:bg-muted">
                      {opportunity.name} - {opportunity.customer_name} (IDR {opportunity.amount.toLocaleString()})
                    </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Quotation No. */}
          <div className="space-y-2">
            <Label htmlFor="quotationNo" className="text-sm font-medium">
              Quotation No.
            </Label>
            <Input id="quotationNo" value={quotationNo} onChange={e => setQuotationNo(e.target.value)} placeholder="Enter quotation number" className="w-full" />
          </div>

          {/* Quotation Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Quotation Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
              <Input id="amount" type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-12" />
            </div>
            <p className="text-xs text-muted-foreground">
              Also from opportunity but can be edited
            </p>
          </div>

          {/* COGS Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-semibold">COGS</Label>
            
            {/* Cost of Goods */}
            <div className="space-y-2">
              <Label htmlFor="cost-of-goods" className="text-sm font-medium">
                Cost of Goods
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                <Input id="cost-of-goods" type="number" value={costOfGoods} onChange={e => setCostOfGoods(e.target.value)} placeholder="0.00" className="pl-12" min="0" step="0.01" />
              </div>
            </div>

            {/* Service Costs */}
            <div className="space-y-2">
              <Label htmlFor="service-costs" className="text-sm font-medium">
                Service Costs
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                <Input id="service-costs" type="number" value={serviceCosts} onChange={e => setServiceCosts(e.target.value)} placeholder="0.00" className="pl-12" min="0" step="0.01" />
              </div>
            </div>

            {/* Other Expenses */}
            <div className="space-y-2">
              <Label htmlFor="other-expenses" className="text-sm font-medium">
                Other Expenses
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">IDR</span>
                <Input id="other-expenses" type="number" value={otherExpenses} onChange={e => setOtherExpenses(e.target.value)} placeholder="0.00" className="pl-12" min="0" step="0.01" />
              </div>
            </div>

            {/* Margin Calculation */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-md">
              <Label className="text-sm font-medium">
                Margin
              </Label>
              <div className="text-lg font-semibold">
                {(() => {
                const quotationAmount = parseFloat(amount) || 0;
                const totalCogs = (parseFloat(costOfGoods) || 0) + (parseFloat(serviceCosts) || 0) + (parseFloat(otherExpenses) || 0);
                const margin = quotationAmount - totalCogs;
                return new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(margin);
              })()}
              </div>
            </div>
          </div>

          {/* Expected Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDate" className="text-sm font-medium">
              Expected Date
            </Label>
            <div className="flex gap-2 items-center">
              <Input id="expectedDate" type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="flex-1" />
              {quarter && <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {quarter}
                </div>}
            </div>
          </div>

          {/* Pipeline Stage - Fixed to Proposal/Negotiation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Pipeline Stage
            </Label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">Proposal/Negotiation</span>
              <span className="text-xs text-muted-foreground">80% probability</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline items are automatically set to Proposal/Negotiation stage for final closing process.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}