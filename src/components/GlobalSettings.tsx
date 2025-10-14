import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, Crown, Users, Target, User } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntityManagement } from '@/components/EntityManagement';
import { CURRENCIES } from '@/lib/currency';
import { CurrencyConverter } from '@/components/CurrencyConverter';


// Role to Dashboard & Badge mapping
const ROLE_DASHBOARD_MAPPING = [
  {
    role: 'admin',
    dashboard: 'Admin Dashboard',
    badge: 'System Administrator',
    icon: Crown,
    color: 'bg-destructive text-destructive-foreground'
  },
  {
    role: 'head',
    dashboard: 'Executive Dashboard',
    badge: 'Strategic Leader', 
    icon: Users,
    color: 'bg-primary text-primary-foreground'
  },
  {
    role: 'manager',
    dashboard: 'Team Dashboard',
    badge: 'Operational Leader',
    icon: Target,
    color: 'bg-secondary text-secondary-foreground'
  },
  {
    role: 'account_manager',
    dashboard: 'Sales Dashboard',
    badge: 'Field Sales',
    icon: User,
    color: 'bg-accent text-accent-foreground'
  }
];

export const GlobalSettings = () => {
  const { 
    loading, 
    getEntityMode, 
    getCurrencyMode, 
    getDashboardDisplay,
    setEntityMode, 
    setCurrencyMode,
    setDashboardDisplay 
  } = useSystemSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Entity Mode State
  const [entityMode, setEntityModeState] = useState<'single' | 'multi'>('single');
  
  // Currency Mode State
  const [currencyMode, setCurrencyModeState] = useState<'single' | 'dual'>('single');
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [localCurrency, setLocalCurrency] = useState('IDR');

  // Dashboard Display State
  const [showTitleAndRegion, setShowTitleAndRegion] = useState(false);

  useEffect(() => {
    if (!loading) {
      const entitySettings = getEntityMode();
      const currencySettings = getCurrencyMode();
      const dashboardSettings = getDashboardDisplay();
      
      setEntityModeState(entitySettings.mode);
      setCurrencyModeState(currencySettings.mode);
      setHomeCurrency(currencySettings.home_currency);
      setLocalCurrency(currencySettings.local_currency || 'IDR');
      setShowTitleAndRegion(dashboardSettings.showTitleAndRegion);
    }
  }, [loading, getEntityMode, getCurrencyMode, getDashboardDisplay]);

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

  const handleSaveDashboardDisplay = async () => {
    setIsSubmitting(true);
    const { error } = await setDashboardDisplay(showTitleAndRegion);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Dashboard display settings updated successfully",
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
      {/* Dashboard & Role Mapping (Informational) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard & Role Mapping
          </CardTitle>
          <CardDescription>
            Standard role-to-dashboard assignment with fixed badges (non-editable).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLE_DASHBOARD_MAPPING.map((mapping) => {
              const IconComponent = mapping.icon;
              return (
                <div key={mapping.role} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{mapping.dashboard}</div>
                      <div className="text-sm text-muted-foreground capitalize">{mapping.role.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <Badge className={mapping.color}>{mapping.badge}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                      One organizational entity. All Managers auto-linked to Head.
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
                      Multiple entities. Admin must assign Managers to specific Head/Entity.
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

      {/* Entity Management - Show when in multi-entity mode */}
      {entityMode === 'multi' && <EntityManagement />}

      {/* Currency Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Currency Options
          </CardTitle>
          <CardDescription>
            Configure home (corporate) currency and optional local currency settings.
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
                      All amounts in home currency only. Dashboards show 1 currency.
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
                      Local + Home currencies. Dashboards show local + home (converted).
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="home-currency">Home (Corporate) Currency</Label>
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
              <strong>Currency Display:</strong>
              {currencyMode === 'single' ? (
                <span> Dashboards show only {homeCurrency} amounts.</span>
              ) : (
                <span> Dashboards show both local ({localCurrency}) and home ({homeCurrency}) with FX conversion.</span>
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
            Save Currency Options
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Display Options
          </CardTitle>
          <CardDescription>
            Configure what additional information appears on dashboard headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Show Title & Region on Dashboards</Label>
              <div className="text-sm text-muted-foreground">
                When ON, dashboard headers show Role + Badge + (Title, Region)
              </div>
            </div>
            <Switch 
              checked={showTitleAndRegion} 
              onCheckedChange={setShowTitleAndRegion}
            />
          </div>

          <Alert>
            <AlertDescription>
              <strong>Examples:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong>OFF:</strong> "Team Dashboard — Operational Leader"</li>
                <li><strong>ON:</strong> "Team Dashboard — Operational Leader (Retail, APAC)"</li>
              </ul>
              <div className="mt-2">
                <strong>Note:</strong> Badges remain fixed per role and are never user-editable. 
                Titles/Regions are dropdowns only (no free-text) and managed by Admin.
              </div>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSaveDashboardDisplay}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Dashboard Display
          </Button>
        </CardContent>
      </Card>

      {/* Currency Converter - Show when in dual currency mode */}
      {currencyMode === 'dual' && <CurrencyConverter />}
    </div>
  );
};