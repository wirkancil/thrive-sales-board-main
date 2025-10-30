import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DollarSign, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type OpportunityStatus = "Hot" | "Warm" | "Cold";
type OpportunityProgress = "Prospecting" | "Qualified" | "Approaching" | "Presentation/POC";

interface Opportunity {
  id: string;
  name: string;
  description?: string;
  product?: string;
  amount?: number;
  currency: string;
  status: OpportunityStatus;
  customer_id: string;
  end_user_id?: string;
  expected_close_date?: string;
  progress?: OpportunityProgress;
}

interface Customer {
  id: string;
  name: string;
  type: string;
}

interface EditOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onUpdate: () => void;
}

export default function EditOpportunityModal({ isOpen, onClose, opportunity, onUpdate }: EditOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [endUsers, setEndUsers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    product: string;
    amount: string;
    currency: string;
    status: OpportunityStatus;
    customerId: string;
    endUserId: string;
    expectedCloseDate: string;
    progress: OpportunityProgress;
  }>({
    name: '',
    description: '',
    product: '',
    amount: '',
    currency: 'USD',
    status: 'Warm',
    customerId: '',
    endUserId: '',
    expectedCloseDate: '',
    progress: 'Prospecting'
  });

  // Populate form data when opportunity changes
  useEffect(() => {
    if (opportunity) {
      setFormData({
        name: opportunity.name,
        description: opportunity.description || '',
        product: opportunity.product || '',
        amount: opportunity.amount?.toString() || '',
        currency: opportunity.currency,
        status: opportunity.status,
        customerId: opportunity.customer_id,
        endUserId: opportunity.end_user_id || '',
        expectedCloseDate: opportunity.expected_close_date || '',
        progress: opportunity.progress || 'Prospecting'
      });
    }
  }, [opportunity]);

  // Fetch customers and end users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const { data: customerData } = await supabase
          .from('organizations')
          .select('id, name, type')
          .eq('type', 'customer')
          .eq('is_active', true);
        
        if (customerData) {
          setCustomers(customerData);
        }

        // Fetch end users
        const { data: endUserData } = await supabase
          .from('organizations')
          .select('id, name, type')
          .eq('type', 'end_user')
          .eq('is_active', true);
        
        if (endUserData) {
          setEndUsers(endUserData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.customerId || !opportunity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({
          name: formData.name,
          description: formData.description || null,
          product: formData.product || null,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          currency: formData.currency,
          expected_close_date: formData.expectedCloseDate || null,
          customer_id: formData.customerId,
          end_user_id: formData.endUserId || formData.customerId,
          end_user_mode: formData.endUserId ? null : 'same_as_customer'
        })
        .eq('id', opportunity.id);

      if (error) throw error;

      toast.success('Opportunity updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast.error('Failed to update opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!opportunity) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ is_closed: true, status: 'cancelled' })
        .eq('id', opportunity.id);

      if (error) throw error;

      toast.success('Opportunity deleted successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error('Failed to delete opportunity');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!opportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Opportunity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Opportunity Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Opportunity Name <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              placeholder="Enter opportunity name"
              className="w-full"
            />
          </div>
          
          {/* Customer */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Customer <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.customerId} 
              onValueChange={(value) => setFormData(prev => ({...prev, customerId: value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter(customer => customer.id && customer.id.trim() !== '' && customer.name && customer.name.trim() !== '')
                  .map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* End User */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">End User (Optional)</Label>
            <Select 
              value={formData.endUserId || "none"} 
              onValueChange={(value) => setFormData(prev => ({...prev, endUserId: value === "none" ? "" : value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select end user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Same as customer</SelectItem>
                {endUsers
                  .filter(user => user.id && user.id.trim() !== '' && user.name && user.name.trim() !== '')
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product</Label>
            <Select 
              value={formData.product} 
              onValueChange={(value) => setFormData(prev => ({...prev, product: value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Automation">Automation</SelectItem>
                <SelectItem value="Prosnap">Prosnap</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Manage Services">Manage Services</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                placeholder="0.00"
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Currency</Label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => setFormData(prev => ({...prev, currency: value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="IDR">IDR</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opportunity Progress */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Opportunity Progress</Label>
            <Select 
              value={formData.progress} 
              onValueChange={(value) => setFormData(prev => ({...prev, progress: value as OpportunityProgress}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prospecting">Prospecting</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Approaching">Approaching</SelectItem>
                <SelectItem value="Presentation/POC">Presentation/POC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              placeholder="Add any additional notes about this opportunity..."
              className="w-full resize-none"
              rows={3}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between pt-6 gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will delete the opportunity. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" onClick={onClose} className="sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || !formData.customerId || loading}
              className="sm:w-auto"
            >
              {loading ? 'Updating...' : 'Update Opportunity'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}