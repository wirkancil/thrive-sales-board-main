-- Insert sample customers and end users for testing (simplified approach)
INSERT INTO organizations (name, type, industry, email, phone, website, is_active, created_by) 
VALUES 
  ('Acme Corporation', 'customer', 'Technology', 'contact@acme.com', '+1-555-0123', 'https://acme.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('GlobalTech Solutions', 'customer', 'Software', 'info@globaltech.com', '+1-555-0124', 'https://globaltech.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Innovative Systems Inc', 'customer', 'Manufacturing', 'hello@innovative.com', '+1-555-0125', 'https://innovative.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Enterprise Partners LLC', 'end_user', 'Consulting', 'contact@enterprisepartners.com', '+1-555-0126', 'https://enterprisepartners.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('TechStart Ventures', 'end_user', 'Startup', 'info@techstart.com', '+1-555-0127', 'https://techstart.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Digital Dynamics Corp', 'end_user', 'Digital Marketing', 'team@digitaldynamics.com', '+1-555-0128', 'https://digitaldynamics.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a');