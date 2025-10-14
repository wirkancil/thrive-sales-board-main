import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { CURRENCIES } from '@/lib/currency';

export const SystemModeSettings = () => {
  const { loading, getEntityMode, getCurrencyMode, setEntityMode, setCurrencyMode } = useSystemSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Entity Mode State
  const [entityMode, setEntityModeState] = useState<'single' | 'multi'>('single');
  
  // Currency Mode State
  const [currencyMode, setCurrencyModeState] = useState<'single' | 'dual'>('single');
  const [homeCurrency, setHomeCurrency] = useState('IDR');
  const [localCurrency, setLocalCurrency] = useState('USD');

  useEffect(() => {
    if (!loading) {
      const entitySettings = getEntityMode();
      const currencySettings = getCurrencyMode();
      
      setEntityModeState(entitySettings.mode);
      setCurrencyModeState(currencySettings.mode);
      setHomeCurrency(currencySettings.home_currency);
      setLocalCurrency(currencySettings.local_currency || 'USD');
    }
  }, [loading, getEntityMode, getCurrencyMode]);

  const handleSaveEntityMode = async () => {
    setIsSubmitting(true);
    const { error } = await setEntityMode(entityMode);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Entity mode updated successfully",
      });
    }
    setIsSubmitting(false);
  };

  const handleSaveCurrencyMode = async () => {
    if (currencyMode === 'dual' && homeCurrency === localCurrency) {
      toast({
        title: "Error",
        description: "Home and Local currencies must be different in Dual Currency mode",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await setCurrencyMode(currencyMode, homeCurrency, localCurrency);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Currency mode updated successfully",
      });
    }
    setIsSubmitting(false);
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
    <div className="space-y-6">
      {/* Entity Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Entity Mode Configuration
          </CardTitle>
          <CardDescription>
            Configure how your organization handles multiple entities and business units.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Entity Mode</Label>
            <RadioGroup
              value={entityMode}
              onValueChange={(value: 'single' | 'multi') => setEntityModeState(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="entity-single" />
                <Label htmlFor="entity-single" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Single Entity (Default)</div>
                    <div className="text-sm text-muted-foreground">
                      One organizational entity. Head automatically owns all Managers.
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multi" id="entity-multi" />
                <Label htmlFor="entity-multi" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Multi Entity</div>
                    <div className="text-sm text-muted-foreground">
                      Multiple entities with separate hierarchies. Admin must assign entities to Heads.
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Assignment Rules:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong>Account Manager:</strong> Admin picks Manager (auto-inherits Head + Entity)</li>
                <li><strong>Manager:</strong> Admin picks Head (auto-inherits Entity)</li>
                <li><strong>Head:</strong> {entityMode === 'single' ? 'Automatically covers all Managers' : 'Admin selects Entity and assigns Managers'}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSaveEntityMode}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Entity Mode
          </Button>
        </CardContent>
      </Card>

      {/* Currency Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Currency Mode Configuration
          </CardTitle>
          <CardDescription>
            Configure how your organization handles different currencies for deals and targets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Currency Mode</Label>
            <RadioGroup
              value={currencyMode}
              onValueChange={(value: 'single' | 'dual') => setCurrencyModeState(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="currency-single" />
                <Label htmlFor="currency-single" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Single Currency (Simple)</div>
                    <div className="text-sm text-muted-foreground">
                      All amounts in one currency. No foreign exchange complexity.
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dual" id="currency-dual" />
                <Label htmlFor="currency-dual" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Dual Currency (Advanced)</div>
                    <div className="text-sm text-muted-foreground">
                      Local + Home currencies with automatic FX conversion and rate locking.
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="home-currency">
                {currencyMode === 'single' ? 'Currency' : 'Home Currency (Corporate)'}
              </Label>
              <Select value={homeCurrency} onValueChange={setHomeCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currencyMode === 'dual' && (
              <div>
                <Label htmlFor="local-currency">Local Currency (Field Sales)</Label>
                <Select value={localCurrency} onValueChange={setLocalCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.flag} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Changes affect new records only. Historical amounts remain unchanged.
              {currencyMode === 'dual' && (
                <>
                  <br />
                  <strong>Dual Currency:</strong> Account Managers enter amounts in Local currency, 
                  Heads/Admins see Home currency with locked FX rates.
                </>
              )}
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSaveCurrencyMode}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Currency Mode
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};