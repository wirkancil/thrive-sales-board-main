import { useSystemSettings } from './useSystemSettings';
import { formatCurrencyWithSymbol, getCurrencyInfo } from '@/lib/currency';

export const useCurrencyFormatter = () => {
  const { getCurrencyMode } = useSystemSettings();
  
  const formatCurrency = (amount: number, currency?: string, showSymbol = true): string => {
    const currencyMode = getCurrencyMode();
    const currencyCode = currency || currencyMode.home_currency;
    return formatCurrencyWithSymbol(amount, currencyCode, showSymbol);
  };
  
  const formatDualCurrency = (
    amount: number, 
    currency: string, 
    amountHome?: number, 
    showSymbol = true
  ): { local: string; home: string | null } => {
    const currencyMode = getCurrencyMode();
    
    if (currencyMode.mode === 'single') {
      return {
        local: formatCurrencyWithSymbol(amount, currency, showSymbol),
        home: null
      };
    }
    
    return {
      local: formatCurrencyWithSymbol(amount, currency, showSymbol),
      home: amountHome ? formatCurrencyWithSymbol(amountHome, currencyMode.home_currency, showSymbol) : null
    };
  };
  
  const getCurrencySymbol = (currencyCode: string): string => {
    const currencyInfo = getCurrencyInfo(currencyCode);
    return `${currencyInfo.flag} ${currencyInfo.symbol}`;
  };
  
  return {
    formatCurrency,
    formatDualCurrency,
    getCurrencySymbol,
    getCurrencyMode
  };
};