import React from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useFxRates } from '@/hooks/useFxRates';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { CURRENCIES, formatCurrencyWithSymbol } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  amountLocal?: number;
  currencyLocal?: string;
  amountHome?: number;
  fxRate?: number;
  fxRateDate?: string;
  showBothCurrencies?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'IDR',
  amountLocal,
  currencyLocal,
  amountHome,
  fxRate,
  fxRateDate,
  showBothCurrencies = true,
  className = ''
}) => {
  const { getCurrencyMode } = useSystemSettings();
  const { convertAmount } = useFxRates();
  
  const currencyMode = getCurrencyMode();
  

  // Single currency mode - just show the amount
  if (currencyMode.mode === 'single') {
    return (
      <span className={className}>
        {formatCurrencyWithSymbol(amount, currency)}
      </span>
    );
  }

  // Dual currency mode
  const homeAmount = amountHome || amount;
  const localAmount = amountLocal || convertAmount(amount, currency, currencyLocal || currencyMode.local_currency || 'USD');
  const homeCurrency = currencyMode.home_currency;
  const localCurrency = currencyLocal || currencyMode.local_currency || 'USD';

  if (!showBothCurrencies) {
    return (
      <span className={className}>
        {formatCurrencyWithSymbol(homeAmount, homeCurrency)}
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {formatCurrencyWithSymbol(homeAmount, homeCurrency)}
        </span>
        <Badge variant="outline" className="text-xs">
          Home
        </Badge>
      </div>
      
      {localAmount && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatCurrencyWithSymbol(localAmount, localCurrency)}
          </span>
          <Badge variant="secondary" className="text-xs">
            Local
          </Badge>
          
          {fxRate && fxRateDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>FX Rate: {fxRate.toFixed(6)}</div>
                    <div>Rate Date: {new Date(fxRateDate).toLocaleDateString()}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
};