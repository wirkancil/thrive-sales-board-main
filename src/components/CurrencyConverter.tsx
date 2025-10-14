import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { CURRENCIES, getCurrencyInfo } from '@/lib/currency';
import { useFxRates } from '@/hooks/useFxRates';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

export const CurrencyConverter = () => {
  const { getCurrencyMode } = useSystemSettings();
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter();
  const { getLatestRate } = useFxRates();
  
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IDR');
  const [amount, setAmount] = useState<string>('1');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const currencyMode = getCurrencyMode();
    if (currencyMode.mode === 'dual') {
      setFromCurrency(currencyMode.home_currency);
      setToCurrency(currencyMode.local_currency || 'IDR');
    }
  }, [getCurrencyMode]);

  useEffect(() => {
    const convertCurrency = () => {
      if (!amount || isNaN(Number(amount))) {
        setConvertedAmount(null);
        setRate(null);
        return;
      }

      const exchangeRate = getLatestRate(fromCurrency, toCurrency);
      if (exchangeRate) {
        setRate(exchangeRate);
        setConvertedAmount(Number(amount) * exchangeRate);
      } else {
        setRate(null);
        setConvertedAmount(null);
      }
    };

    convertCurrency();
  }, [amount, fromCurrency, toCurrency, getLatestRate]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Currency Converter
        </CardTitle>
        <CardDescription>
          Convert between different currencies using current exchange rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>

        {/* From Currency */}
        <div className="space-y-2">
          <Label htmlFor="from-currency">From Currency</Label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span>{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <span className="text-muted-foreground">- {currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swapCurrencies}
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <Label htmlFor="to-currency">To Currency</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span>{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <span className="text-muted-foreground">- {currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        {convertedAmount !== null && rate !== null ? (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(convertedAmount, toCurrency)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatCurrency(Number(amount), fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
              </div>
            </div>
            
            <div className="border-t pt-3 text-center">
              <div className="text-sm text-muted-foreground">
                Exchange Rate: 1 {getCurrencySymbol(fromCurrency)} = {rate.toFixed(4)} {getCurrencySymbol(toCurrency)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
            {amount && !isNaN(Number(amount)) ? (
              'Exchange rate not available'
            ) : (
              'Enter an amount to convert'
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};