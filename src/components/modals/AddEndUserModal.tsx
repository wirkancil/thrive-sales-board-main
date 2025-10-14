import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddEndUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface NewEndUser {
  name: string;
  taxId: string;
  website: string;
  phone: string;
  email: string;
  marketSize: string;
  industry: string;
  addresses: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }[];
}

export default function AddEndUserModal({ isOpen, onOpenChange, onSuccess }: AddEndUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [newEndUser, setNewEndUser] = useState<NewEndUser>({
    name: '',
    taxId: '',
    website: '',
    phone: '',
    email: '',
    marketSize: '',
    industry: '',
    addresses: [
      {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Indonesia'
      }
    ]
  });

  const handleSubmit = async () => {
    if (!newEndUser.name.trim()) {
      toast.error('End user name is required');
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast.error('You must be logged in to create an end user');
        return;
      }

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newEndUser.name.trim(),
          type: 'end_user',
          tax_id: newEndUser.taxId.trim() || null,
          website: newEndUser.website.trim() || null,
          phone: newEndUser.phone.trim() || null,
          email: newEndUser.email.trim() || null,
          market_size: newEndUser.marketSize.trim() || null,
          industry: newEndUser.industry.trim() || null,
          addresses: newEndUser.addresses.filter(addr => 
            addr.street.trim() || addr.city.trim() || addr.state.trim() || addr.postalCode.trim()
          ).length > 0 ? newEndUser.addresses : null,
          created_by: user.user.id,
          approval_status: 'draft',
          is_active: true
        });

      if (error) throw error;

      toast.success('End user created successfully! Awaiting approval.');
      onSuccess?.();
      handleCancel();
    } catch (error) {
      console.error('Error creating end user:', error);
      toast.error('Failed to create end user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewEndUser({
      name: '',
      taxId: '',
      website: '',
      phone: '',
      email: '',
      marketSize: '',
      industry: '',
      addresses: [
        {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Indonesia'
        }
      ]
    });
    onOpenChange(false);
  };

  const updateAddress = (index: number, field: keyof NewEndUser['addresses'][0], value: string) => {
    const updatedAddresses = [...newEndUser.addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setNewEndUser(prev => ({ ...prev, addresses: updatedAddresses }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New End User</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* End User Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              End User Name <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="name"
              value={newEndUser.name}
              onChange={(e) => setNewEndUser(prev => ({...prev, name: e.target.value}))}
              placeholder="Enter end user organization name"
              className="w-full"
            />
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-sm font-medium">Tax ID / NPWP (Optional)</Label>
            <Input 
              id="taxId"
              value={newEndUser.taxId}
              onChange={(e) => setNewEndUser(prev => ({...prev, taxId: e.target.value}))}
              placeholder="Enter tax identification number"
              className="w-full"
            />
          </div>

          {/* Market Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Market Size (Optional)</Label>
            <Select 
              value={newEndUser.marketSize} 
              onValueChange={(value) => setNewEndUser(prev => ({...prev, marketSize: value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select market size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMB">Small and Medium Business (SMB)</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Industry (Optional)</Label>
            <Select 
              value={newEndUser.industry} 
              onValueChange={(value) => setNewEndUser(prev => ({...prev, industry: value}))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website (Optional)</Label>
              <Input 
                id="website"
                type="url"
                value={newEndUser.website}
                onChange={(e) => setNewEndUser(prev => ({...prev, website: e.target.value}))}
                placeholder="https://www.example.com"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
              <Input 
                id="phone"
                type="tel"
                value={newEndUser.phone}
                onChange={(e) => setNewEndUser(prev => ({...prev, phone: e.target.value}))}
                placeholder="Enter phone number"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email (Optional)</Label>
              <Input 
                id="email"
                type="email"
                value={newEndUser.email}
                onChange={(e) => setNewEndUser(prev => ({...prev, email: e.target.value}))}
                placeholder="Enter email address"
                className="w-full"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Address (Optional)</Label>
            
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-xs font-medium">Street Address</Label>
                <Textarea
                  id="street"
                  value={newEndUser.addresses[0].street}
                  onChange={(e) => updateAddress(0, 'street', e.target.value)}
                  placeholder="Enter street address"
                  className="w-full resize-none"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-medium">City</Label>
                  <Input 
                    id="city"
                    value={newEndUser.addresses[0].city}
                    onChange={(e) => updateAddress(0, 'city', e.target.value)}
                    placeholder="City"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs font-medium">State/Province</Label>
                  <Input 
                    id="state"
                    value={newEndUser.addresses[0].state}
                    onChange={(e) => updateAddress(0, 'state', e.target.value)}
                    placeholder="State"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-xs font-medium">Postal Code</Label>
                  <Input 
                    id="postalCode"
                    value={newEndUser.addresses[0].postalCode}
                    onChange={(e) => updateAddress(0, 'postalCode', e.target.value)}
                    placeholder="Postal Code"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs font-medium">Country</Label>
                  <Select 
                    value={newEndUser.addresses[0].country} 
                    onValueChange={(value) => updateAddress(0, 'country', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indonesia">Indonesia</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Thailand">Thailand</SelectItem>
                      <SelectItem value="Philippines">Philippines</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 gap-3">
          <Button variant="outline" onClick={handleCancel} className="sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!newEndUser.name.trim() || loading}
            className="sm:w-auto"
          >
            {loading ? 'Creating...' : 'Create End User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}