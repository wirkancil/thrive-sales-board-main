import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit3, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { useFxRates } from '@/hooks/useFxRates';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
];

export const FxRateManagement = () => {
  const { fxRates, loading, createFxRate, updateFxRate, deleteFxRate } = useFxRates();
  const { toast } = useToast();
  
  const [newFromCurrency, setNewFromCurrency] = useState('');
  const [newToCurrency, setNewToCurrency] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newRateDate, setNewRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingRate, setEditingRate] = useState<{ id: string; rate: number; rate_date: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRateId, setDeletingRateId] = useState<string | null>(null);

  const handleCreateRate = async () => {
    if (!newFromCurrency || !newToCurrency || !newRate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newFromCurrency === newToCurrency) {
      toast({
        title: "Error",
        description: "From and To currencies must be different",
        variant: "destructive",
      });
      return;
    }

    const rateValue = parseFloat(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: "Error",
        description: "Rate must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await createFxRate(newFromCurrency, newToCurrency, rateValue, newRateDate);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "FX rate created successfully",
      });
      setNewFromCurrency('');
      setNewToCurrency('');
      setNewRate('');
      setNewRateDate(new Date().toISOString().split('T')[0]);
    }
    setIsSubmitting(false);
  };

  const handleUpdateRate = async () => {
    if (!editingRate) return;

    setIsSubmitting(true);
    const { error } = await updateFxRate(editingRate.id, {
      rate: editingRate.rate,
      rate_date: editingRate.rate_date
    });
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "FX rate updated successfully",
      });
      setEditingRate(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteRate = async (id: string) => {
    setDeletingRateId(id);
    const { error } = await deleteFxRate(id);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "FX rate deleted successfully",
      });
    }
    setDeletingRateId(null);
  };

  const toggleRateStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await updateFxRate(id, { is_active: !currentStatus });
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `FX rate ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    }
  };

  const formatRate = (rate: number) => {
    if (rate >= 1) {
      return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    } else {
      return rate.toFixed(8);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          FX Rate Management
        </CardTitle>
        <CardDescription>
          Manage foreign exchange rates for dual currency mode. Rates are used for automatic conversion between local and home currencies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Create New FX Rate */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Add New FX Rate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="from-currency">From Currency *</Label>
                <Select value={newFromCurrency} onValueChange={setNewFromCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to-currency">To Currency *</Label>
                <Select value={newToCurrency} onValueChange={setNewToCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rate">Exchange Rate *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="any"
                  min="0"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="e.g., 15800.00"
                />
              </div>
              <div>
                <Label htmlFor="rate-date">Rate Date</Label>
                <Input
                  id="rate-date"
                  type="date"
                  value={newRateDate}
                  onChange={(e) => setNewRateDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreateRate}
                  disabled={!newFromCurrency || !newToCurrency || !newRate || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Rate
                </Button>
              </div>
            </div>
          </div>

          {/* FX Rates List */}
          <div>
            <h3 className="text-lg font-medium mb-4">Current FX Rates</h3>
            {fxRates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No FX rates found. Add your first rate above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency Pair</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fxRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="font-medium">
                          {rate.from_currency} → {rate.to_currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingRate?.id === rate.id ? (
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={editingRate.rate}
                            onChange={(e) => setEditingRate({
                              ...editingRate,
                              rate: parseFloat(e.target.value) || 0
                            })}
                            className="max-w-xs"
                          />
                        ) : (
                          <span className="font-mono">{formatRate(rate.rate)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRate?.id === rate.id ? (
                          <Input
                            type="date"
                            value={editingRate.rate_date}
                            onChange={(e) => setEditingRate({
                              ...editingRate,
                              rate_date: e.target.value
                            })}
                            className="max-w-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(rate.rate_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={rate.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleRateStatus(rate.id, rate.is_active)}
                        >
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(rate.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingRate?.id === rate.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleUpdateRate}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRate(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRate({
                                  id: rate.id,
                                  rate: rate.rate,
                                  rate_date: rate.rate_date
                                })}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    {deletingRateId === rate.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete FX Rate</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the rate for {rate.from_currency} → {rate.to_currency}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRate(rate.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};