-- Phase 2: Currency Mode & FX Management

-- Create FX rates table for currency conversion
CREATE TABLE public.fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(from_currency, to_currency, rate_date)
);

-- Enable RLS on fx_rates
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for fx_rates
CREATE POLICY "Admins can manage FX rates" 
ON public.fx_rates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can read active FX rates" 
ON public.fx_rates 
FOR SELECT 
USING (is_active = true);

-- Add dual currency fields to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN amount_local NUMERIC(15,2),
ADD COLUMN currency_local TEXT,
ADD COLUMN fx_rate NUMERIC(18,8),
ADD COLUMN fx_rate_date DATE,
ADD COLUMN amount_home NUMERIC(15,2);

-- Add dual currency fields to pipeline_items table
ALTER TABLE public.pipeline_items 
ADD COLUMN amount_local NUMERIC(15,2),
ADD COLUMN currency_local TEXT,
ADD COLUMN fx_rate NUMERIC(18,8),
ADD COLUMN fx_rate_date DATE,
ADD COLUMN amount_home NUMERIC(15,2);

-- Add dual currency fields to sales_targets table
ALTER TABLE public.sales_targets 
ADD COLUMN amount_local NUMERIC(15,2),
ADD COLUMN currency_local TEXT,
ADD COLUMN fx_rate NUMERIC(18,8),
ADD COLUMN fx_rate_date DATE,
ADD COLUMN amount_home NUMERIC(15,2);

-- Add dual currency fields to department_targets table
ALTER TABLE public.department_targets 
ADD COLUMN amount_local NUMERIC(15,2),
ADD COLUMN currency_local TEXT,
ADD COLUMN fx_rate NUMERIC(18,8),
ADD COLUMN fx_rate_date DATE,
ADD COLUMN amount_home NUMERIC(15,2);

-- Create function to get latest FX rate
CREATE OR REPLACE FUNCTION public.get_fx_rate(
  from_curr TEXT,
  to_curr TEXT,
  rate_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  fx_rate NUMERIC;
BEGIN
  -- If same currency, return 1
  IF from_curr = to_curr THEN
    RETURN 1.0;
  END IF;
  
  -- Get the most recent rate for the date or before
  SELECT rate INTO fx_rate
  FROM public.fx_rates
  WHERE from_currency = from_curr
    AND to_currency = to_curr
    AND rate_date <= rate_date
    AND is_active = true
  ORDER BY rate_date DESC
  LIMIT 1;
  
  -- If no direct rate found, try inverse rate
  IF fx_rate IS NULL THEN
    SELECT (1.0 / rate) INTO fx_rate
    FROM public.fx_rates
    WHERE from_currency = to_curr
      AND to_currency = from_curr
      AND rate_date <= rate_date
      AND is_active = true
    ORDER BY rate_date DESC
    LIMIT 1;
  END IF;
  
  -- If still no rate found, return NULL (caller should handle)
  RETURN fx_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to convert currency amounts
CREATE OR REPLACE FUNCTION public.convert_currency(
  amount NUMERIC,
  from_curr TEXT,
  to_curr TEXT,
  rate_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  fx_rate NUMERIC;
  converted_amount NUMERIC;
BEGIN
  -- Get FX rate
  fx_rate := public.get_fx_rate(from_curr, to_curr, rate_date);
  
  -- If no rate found, return NULL
  IF fx_rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert amount
  converted_amount := amount * fx_rate;
  
  RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function to auto-calculate currency conversions
CREATE OR REPLACE FUNCTION public.auto_convert_currencies()
RETURNS TRIGGER AS $$
DECLARE
  currency_settings JSONB;
  home_currency TEXT;
  local_currency TEXT;
  fx_rate NUMERIC;
BEGIN
  -- Get currency mode settings
  SELECT setting_value INTO currency_settings
  FROM public.system_settings
  WHERE setting_key = 'currency_mode';
  
  -- Only process if in dual currency mode
  IF currency_settings->>'mode' = 'dual' THEN
    home_currency := currency_settings->>'home_currency';
    local_currency := currency_settings->>'local_currency';
    
    -- If amount_local is provided, convert to home currency
    IF NEW.amount_local IS NOT NULL AND NEW.currency_local IS NOT NULL THEN
      fx_rate := public.get_fx_rate(NEW.currency_local, home_currency, COALESCE(NEW.fx_rate_date, CURRENT_DATE));
      
      IF fx_rate IS NOT NULL THEN
        NEW.fx_rate := fx_rate;
        NEW.fx_rate_date := COALESCE(NEW.fx_rate_date, CURRENT_DATE);
        NEW.amount_home := NEW.amount_local * fx_rate;
        
        -- Also set the main amount field to home currency amount
        NEW.amount := NEW.amount_home;
        NEW.currency := home_currency;
      END IF;
    
    -- If only main amount is provided, assume it's in home currency
    ELSIF NEW.amount IS NOT NULL AND NEW.currency IS NOT NULL THEN
      NEW.amount_home := NEW.amount;
      NEW.currency_local := local_currency;
      
      -- Convert to local currency for display
      fx_rate := public.get_fx_rate(NEW.currency, local_currency, CURRENT_DATE);
      IF fx_rate IS NOT NULL THEN
        NEW.amount_local := NEW.amount * fx_rate;
        NEW.fx_rate := (1.0 / fx_rate); -- Store inverse rate for local to home conversion
        NEW.fx_rate_date := CURRENT_DATE;
      END IF;
    END IF;
  
  -- In single currency mode, just copy amounts
  ELSE
    IF NEW.amount IS NOT NULL THEN
      NEW.amount_home := NEW.amount;
      NEW.amount_local := NEW.amount;
      NEW.fx_rate := 1.0;
      NEW.fx_rate_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic currency conversion
CREATE TRIGGER auto_convert_opportunities_currencies
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_currencies();

CREATE TRIGGER auto_convert_pipeline_items_currencies
  BEFORE INSERT OR UPDATE ON public.pipeline_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_currencies();

CREATE TRIGGER auto_convert_sales_targets_currencies
  BEFORE INSERT OR UPDATE ON public.sales_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_currencies();

CREATE TRIGGER auto_convert_department_targets_currencies
  BEFORE INSERT OR UPDATE ON public.department_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_currencies();

-- Create updated_at trigger for fx_rates
CREATE TRIGGER update_fx_rates_updated_at
  BEFORE UPDATE ON public.fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some common FX rates (admin should update these regularly)
INSERT INTO public.fx_rates (from_currency, to_currency, rate, rate_date, is_active) VALUES
('USD', 'IDR', 15800.00, CURRENT_DATE, true),
('EUR', 'IDR', 17200.00, CURRENT_DATE, true),
('SGD', 'IDR', 11800.00, CURRENT_DATE, true),
('IDR', 'USD', 0.0000633, CURRENT_DATE, true),
('IDR', 'EUR', 0.0000581, CURRENT_DATE, true),
('IDR', 'SGD', 0.0000847, CURRENT_DATE, true);