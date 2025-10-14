// Currency definitions with symbols and flags
export const CURRENCIES = [
  { 
    code: 'IDR', 
    name: 'Indonesian Rupiah', 
    symbol: 'Rp',
    flag: '🇮🇩',
    decimals: 0
  },
  { 
    code: 'USD', 
    name: 'US Dollar', 
    symbol: '$',
    flag: '🇺🇸',
    decimals: 2
  },
  { 
    code: 'EUR', 
    name: 'Euro', 
    symbol: '€',
    flag: '🇪🇺',
    decimals: 2
  },
  { 
    code: 'SGD', 
    name: 'Singapore Dollar', 
    symbol: 'S$',
    flag: '🇸🇬',
    decimals: 2
  },
  { 
    code: 'MYR', 
    name: 'Malaysian Ringgit', 
    symbol: 'RM',
    flag: '🇲🇾',
    decimals: 2
  },
  { 
    code: 'THB', 
    name: 'Thai Baht', 
    symbol: '฿',
    flag: '🇹🇭',
    decimals: 2
  },
  { 
    code: 'JPY', 
    name: 'Japanese Yen', 
    symbol: '¥',
    flag: '🇯🇵',
    decimals: 0
  },
  { 
    code: 'CNY', 
    name: 'Chinese Yuan', 
    symbol: '¥',
    flag: '🇨🇳',
    decimals: 2
  },
];

export const getCurrencyInfo = (code: string) => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]; // Default to IDR
};

export const formatCurrencyWithSymbol = (amount: number, currencyCode: string, showSymbol = true): string => {
  const currencyInfo = getCurrencyInfo(currencyCode);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals,
  }).format(amount);
  
  if (showSymbol) {
    return `${currencyInfo.flag} ${formatted}`;
  }
  
  return formatted;
};