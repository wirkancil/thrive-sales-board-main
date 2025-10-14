-- Insert default system settings if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, updated_by) 
VALUES 
  ('entity_mode', '{"mode": "single"}', null),
  ('currency_mode', '{"mode": "single", "home_currency": "USD"}', null),
  ('dashboard_display', '{"showTitleAndRegion": false}', null)
ON CONFLICT (setting_key) DO NOTHING;