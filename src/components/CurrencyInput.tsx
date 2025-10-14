import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useFxRates } from '@/hooks/useFxRates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

import { CURRENCIES, formatCurrencyWithSymbol } from '@/lib/currency';

interface CurrencyInputProps {
  label?: string;
  value?: number;
  currency?: string;
  onValueChange?: (amount: number, currency: string, amountHome?: number, fxRate?: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label = 'Amount',
  value,
  currency,
  onValueChange,
  disabled = false,
  className = '',
  placeholder = '0.00',
  required = false
}) => {
  const { getCurrencyMode } = useSystemSettings();
  const { getLatestRate } = useFxRates();
  
  const currencyMode = getCurrencyMode();
  const [localAmount, setLocalAmount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [fxRate, setFxRate] = useState<number | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setLocalAmount(value.toString());
    }
    if (currency) {
      setSelectedCurrency(currency);
    } else if (currencyMode.mode === 'single') {
      setSelectedCurrency(currencyMode.home_currency);
    } else {
      setSelectedCurrency(currencyMode.local_currency || 'USD');
    }
  }, [value, currency, currencyMode]);

  useEffect(() => {
    if (localAmount && selectedCurrency && currencyMode.mode === 'dual') {
      const amount = parseFloat(localAmount);
      if (!isNaN(amount) && amount > 0) {
        const rate = getLatestRate(selectedCurrency, currencyMode.home_currency);
        if (rate) {
          const homeAmount = amount * rate;
          setConvertedAmount(homeAmount);
          setFxRate(rate);
        } else {
          setConvertedAmount(null);
          setFxRate(null);
        }
      } else {
        setConvertedAmount(null);
        setFxRate(null);
      }
    }
  }, [localAmount, selectedCurrency, currencyMode, getLatestRate]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setLocalAmount(newAmount);
    
    const numericAmount = parseFloat(newAmount);
    if (!isNaN(numericAmount) && onValueChange) {
      if (currencyMode.mode === 'single') {
        onValueChange(numericAmount, selectedCurrency);
      } else {
        // Dual currency mode
        const rate = getLatestRate(selectedCurrency, currencyMode.home_currency);
        const homeAmount = rate ? numericAmount * rate : numericAmount;
        onValueChange(numericAmount, selectedCurrency, homeAmount, rate || undefined);
      }
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    
    const numericAmount = parseFloat(localAmount);
    if (!isNaN(numericAmount) && onValueChange) {
      if (currencyMode.mode === 'single') {
        onValueChange(numericAmount, newCurrency);
      } else {
        // Dual currency mode
        const rate = getLatestRate(newCurrency, currencyMode.home_currency);
        const homeAmount = rate ? numericAmount * rate : numericAmount;
        onValueChange(numericAmount, newCurrency, homeAmount, rate || undefined);
      }
    }
  };


  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            step="any"
            min="0"
            value={localAmount}
            onChange={handleAmountChange}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
        
        <div className="w-24">
          <Select
            value={selectedCurrency}
            onValueChange={handleCurrencyChange}
            disabled={disabled || currencyMode.mode === 'single'}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show conversion in dual currency mode */}
      {currencyMode.mode === 'dual' && convertedAmount && fxRate && selectedCurrency !== currencyMode.home_currency && (
        <Card className="p-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedCurrency}
              </Badge>
              <span>{formatCurrencyWithSymbol(parseFloat(localAmount) || 0, selectedCurrency)}</span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                {currencyMode.home_currency}
              </Badge>
              <span className="font-semibold">
                {formatCurrencyWithSymbol(convertedAmount, currencyMode.home_currency)}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            Rate: 1 {selectedCurrency} = {fxRate.toFixed(6)} {currencyMode.home_currency}
          </div>
        </Card>
      )}
    </div>
  );
};