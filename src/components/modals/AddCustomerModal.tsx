import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerFormData {
  name: string;
  legal_name: string;
  tax_id: string;
  website: string;
  phone: string;
  email: string;
  market_size: string;
  industry: string;
  notes: string;
  billing_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'customer' | 'end-user';
}

export default function AddCustomerModal({ isOpen, onOpenChange, onSuccess, mode = 'customer' }: AddCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [customerType, setCustomerType] = useState<'new' | 'from-master-data'>('new');
  const [masterDataCustomers, setMasterDataCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    legal_name: '',
    tax_id: '',
    website: '',
    phone: '',
    email: '',
    market_size: '',
    industry: '',
    notes: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'Indonesia'
    },
    shipping_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'Indonesia'
    }
  });

  // Fetch master data customers when modal opens and mode is end-user
  useEffect(() => {
    if (isOpen && mode === 'end-user' && customerType === 'from-master-data') {
      fetchMasterDataCustomers();
    }
  }, [isOpen, mode, customerType]);

  const fetchMasterDataCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'customer')
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMasterDataCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSelection = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const selectedCustomer = masterDataCustomers.find(c => c.id === customerId);
    
    if (selectedCustomer) {
      // Auto-populate form with selected customer data
      setFormData({
        name: selectedCustomer.name || '',
        legal_name: selectedCustomer.legal_name || '',
        tax_id: selectedCustomer.tax_id || '',
        website: selectedCustomer.website || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        market_size: selectedCustomer.market_size || '',
        industry: selectedCustomer.industry || '',
        notes: selectedCustomer.notes || '',
        billing_address: selectedCustomer.addresses?.billing || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'Indonesia'
        },
        shipping_address: selectedCustomer.addresses?.shipping || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'Indonesia'
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error('You must be logged in to create a customer');
        return;
      }

      // Prepare shipping address (same as billing if checkbox is checked)
      const shippingAddress = sameAsBilling ? formData.billing_address : formData.shipping_address;

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          tax_id: formData.tax_id.trim() || null,
          website: formData.website.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          market_size: formData.market_size.trim() || null,
          industry: formData.industry.trim() || null,
          type: mode === 'end-user' ? 'end_user' : 'customer',
          addresses: {
            billing: formData.billing_address,
            shipping: shippingAddress
          },
          created_by: user.data.user.id,
          approval_status: 'draft',
          is_active: true
        });

      if (error) throw error;

      toast.success(`${mode === 'end-user' ? 'End user' : 'Customer'} created successfully! It will be available after admin approval.`);
      onSuccess?.();
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      legal_name: '',
      tax_id: '',
      website: '',
      phone: '',
      email: '',
      market_size: '',
      industry: '',
      notes: '',
      billing_address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Indonesia'
      },
      shipping_address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Indonesia'
      }
    });
    setSameAsBilling(true);
    setCustomerType('new');
    setSelectedCustomerId('');
    setMasterDataCustomers([]);
  };

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Government',
    'Energy',
    'Transportation',
    'Real Estate',
    'Other'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'end-user' ? 'Add New End User' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            {/* Customer Type Selection (only for end users) */}
            {mode === 'end-user' && (
              <div className="space-y-2">
                <Label htmlFor="customer_type">Customer Type</Label>
                <Select 
                  value={customerType} 
                  onValueChange={(value: 'new' | 'from-master-data') => setCustomerType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="from-master-data">From Master Data Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Master Data Customer Selection (only when from-master-data is selected) */}
            {mode === 'end-user' && customerType === 'from-master-data' && (
              <div className="space-y-2">
                <Label htmlFor="master_customer">Select Master Data Customer</Label>
                <Select 
                  value={selectedCustomerId} 
                  onValueChange={handleCustomerSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {masterDataCustomers
                      .filter(customer => customer.id && customer.id.trim() !== '' && customer.name && customer.name.trim() !== '')
                      .map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {masterDataCustomers.length === 0 && !loadingCustomers && (
                  <p className="text-sm text-muted-foreground">No approved customers found</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">
                {mode === 'end-user' ? 'End User Name' : 'Customer Name'} <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                placeholder={`Enter ${mode === 'end-user' ? 'end user' : 'customer'} name`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input 
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData(prev => ({...prev, legal_name: e.target.value}))}
                placeholder="Legal company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / NPWP</Label>
              <Input 
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData(prev => ({...prev, tax_id: e.target.value}))}
                placeholder="Tax identification number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_size">Market Size</Label>
              <Select 
                value={formData.market_size} 
                onValueChange={(value) => setFormData(prev => ({...prev, market_size: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select market size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMB">Small and Medium Business (SMB)</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => setFormData(prev => ({...prev, industry: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({...prev, website: e.target.value}))}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                placeholder="+62 21 1234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                placeholder="contact@customer.com"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            
            {/* Billing Address */}
            <div className="space-y-3">
              <h4 className="font-medium">Billing Address</h4>
              
              <div className="space-y-2">
                <Label htmlFor="billing_street">Street Address</Label>
                <Input 
                  id="billing_street"
                  value={formData.billing_address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, 
                    billing_address: {...prev.billing_address, street: e.target.value}
                  }))}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="billing_city">City</Label>
                  <Input 
                    id="billing_city"
                    value={formData.billing_address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      billing_address: {...prev.billing_address, city: e.target.value}
                    }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_state">State/Province</Label>
                  <Input 
                    id="billing_state"
                    value={formData.billing_address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      billing_address: {...prev.billing_address, state: e.target.value}
                    }))}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="billing_zip">ZIP/Postal Code</Label>
                  <Input 
                    id="billing_zip"
                    value={formData.billing_address.zip}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      billing_address: {...prev.billing_address, zip: e.target.value}
                    }))}
                    placeholder="ZIP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_country">Country</Label>
                  <Input 
                    id="billing_country"
                    value={formData.billing_address.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      billing_address: {...prev.billing_address, country: e.target.value}
                    }))}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="same_as_billing"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="same_as_billing">Shipping address same as billing</Label>
            </div>

            {/* Shipping Address (only show if different from billing) */}
            {!sameAsBilling && (
              <div className="space-y-3">
                <h4 className="font-medium">Shipping Address</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="shipping_street">Street Address</Label>
                  <Input 
                    id="shipping_street"
                    value={formData.shipping_address.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      shipping_address: {...prev.shipping_address, street: e.target.value}
                    }))}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_city">City</Label>
                    <Input 
                      id="shipping_city"
                      value={formData.shipping_address.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        shipping_address: {...prev.shipping_address, city: e.target.value}
                      }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_state">State/Province</Label>
                    <Input 
                      id="shipping_state"
                      value={formData.shipping_address.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        shipping_address: {...prev.shipping_address, state: e.target.value}
                      }))}
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_zip">ZIP/Postal Code</Label>
                    <Input 
                      id="shipping_zip"
                      value={formData.shipping_address.zip}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        shipping_address: {...prev.shipping_address, zip: e.target.value}
                      }))}
                      placeholder="ZIP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_country">Country</Label>
                    <Input 
                      id="shipping_country"
                      value={formData.shipping_address.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        shipping_address: {...prev.shipping_address, country: e.target.value}
                      }))}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
            placeholder="Additional notes about this customer..."
            rows={3}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || loading}
          >
            {loading ? 'Creating...' : `Create ${mode === 'end-user' ? 'End User' : 'Customer'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}