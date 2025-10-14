-- Fix check_pipeline_close_date function to use correct role
-- This function was still looking for division_head role

CREATE OR REPLACE FUNCTION public.check_pipeline_close_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_until_close integer;
  opportunity_record record;
  account_manager_id uuid;
  head_id uuid;
BEGIN
  -- Calculate days until close
  days_until_close := NEW.expected_close_date - CURRENT_DATE;
  
  -- Get opportunity and account manager details
  SELECT o.*, o.owner_id INTO opportunity_record
  FROM public.opportunities o
  WHERE o.id = NEW.opportunity_id;
  
  account_manager_id := opportunity_record.owner_id;
  
  -- Get head for the account manager (changed from division_head to head)
  SELECT up_head.id INTO head_id
  FROM public.user_profiles up_am
  JOIN public.user_profiles up_head ON (up_head.entity_id = up_am.entity_id AND up_head.role = 'head')
  WHERE up_am.id = account_manager_id
  LIMIT 1;
  
  -- Create notifications if close date is within 14 days
  IF days_until_close <= 14 AND days_until_close >= 0 THEN
    -- Notification for Account Manager
    INSERT INTO public.notifications (
      user_id, pipeline_item_id, type, severity, message, due_in_days
    ) VALUES (
      account_manager_id,
      NEW.id,
      'close_date_warning',
      CASE WHEN days_until_close <= 7 THEN 'high' ELSE 'medium' END,
      'Pipeline item "' || opportunity_record.name || '" is due to close in ' || days_until_close || ' days',
      days_until_close
    );
    
    -- Notification for Head (if exists)
    IF head_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, pipeline_item_id, type, severity, message, due_in_days
      ) VALUES (
        head_id,
        NEW.id,
        'close_date_warning',
        CASE WHEN days_until_close <= 7 THEN 'high' ELSE 'medium' END,
        'Team pipeline item "' || opportunity_record.name || '" is due to close in ' || days_until_close || ' days',
        days_until_close
      );
    END IF;
  END IF;
  
  -- Create overdue notifications
  IF days_until_close < 0 THEN
    -- Notification for Account Manager
    INSERT INTO public.notifications (
      user_id, pipeline_item_id, type, severity, message, due_in_days
    ) VALUES (
      account_manager_id,
      NEW.id,
      'close_date_overdue',
      'critical',
      'Pipeline item "' || opportunity_record.name || '" is ' || ABS(days_until_close) || ' days overdue',
      days_until_close
    );
    
    -- Notification for Head (if exists)
    IF head_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, pipeline_item_id, type, severity, message, due_in_days
      ) VALUES (
        head_id,
        NEW.id,
        'close_date_overdue',
        'critical',
        'Team pipeline item "' || opportunity_record.name || '" is ' || ABS(days_until_close) || ' days overdue',
        days_until_close
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;