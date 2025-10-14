-- Insert sample customers and end users for testing
INSERT INTO organizations (name, type, industry, email, phone, website, is_active, created_by) 
VALUES 
  ('Acme Corporation', 'customer', 'Technology', 'contact@acme.com', '+1-555-0123', 'https://acme.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('GlobalTech Solutions', 'customer', 'Software', 'info@globaltech.com', '+1-555-0124', 'https://globaltech.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Innovative Systems Inc', 'customer', 'Manufacturing', 'hello@innovative.com', '+1-555-0125', 'https://innovative.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Enterprise Partners LLC', 'end_user', 'Consulting', 'contact@enterprisepartners.com', '+1-555-0126', 'https://enterprisepartners.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('TechStart Ventures', 'end_user', 'Startup', 'info@techstart.com', '+1-555-0127', 'https://techstart.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a'),
  ('Digital Dynamics Corp', 'end_user', 'Digital Marketing', 'team@digitaldynamics.com', '+1-555-0128', 'https://digitaldynamics.com', true, '57cc8691-3095-4d5c-9d2b-5d98af61ea2a')
ON CONFLICT (id) DO NOTHING;

-- Add contacts for the organizations
INSERT INTO organization_contacts (organization_id, full_name, title, email, phone, is_primary, created_by)
SELECT 
  o.id,
  CASE 
    WHEN o.name = 'Acme Corporation' THEN 'John Smith'
    WHEN o.name = 'GlobalTech Solutions' THEN 'Sarah Johnson'
    WHEN o.name = 'Innovative Systems Inc' THEN 'Mike Davis'
    WHEN o.name = 'Enterprise Partners LLC' THEN 'Emily Wilson'
    WHEN o.name = 'TechStart Ventures' THEN 'David Brown'
    WHEN o.name = 'Digital Dynamics Corp' THEN 'Lisa Garcia'
  END as full_name,
  CASE 
    WHEN o.name = 'Acme Corporation' THEN 'CTO'
    WHEN o.name = 'GlobalTech Solutions' THEN 'VP of Sales'
    WHEN o.name = 'Innovative Systems Inc' THEN 'Operations Manager'
    WHEN o.name = 'Enterprise Partners LLC' THEN 'Senior Partner'
    WHEN o.name = 'TechStart Ventures' THEN 'Founder & CEO'
    WHEN o.name = 'Digital Dynamics Corp' THEN 'Marketing Director'
  END as title,
  CASE 
    WHEN o.name = 'Acme Corporation' THEN 'john.smith@acme.com'
    WHEN o.name = 'GlobalTech Solutions' THEN 'sarah.johnson@globaltech.com'
    WHEN o.name = 'Innovative Systems Inc' THEN 'mike.davis@innovative.com'
    WHEN o.name = 'Enterprise Partners LLC' THEN 'emily.wilson@enterprisepartners.com'
    WHEN o.name = 'TechStart Ventures' THEN 'david.brown@techstart.com'
    WHEN o.name = 'Digital Dynamics Corp' THEN 'lisa.garcia@digitaldynamics.com'
  END as email,
  CASE 
    WHEN o.name = 'Acme Corporation' THEN '+1-555-1001'
    WHEN o.name = 'GlobalTech Solutions' THEN '+1-555-1002'
    WHEN o.name = 'Innovative Systems Inc' THEN '+1-555-1003'
    WHEN o.name = 'Enterprise Partners LLC' THEN '+1-555-1004'
    WHEN o.name = 'TechStart Ventures' THEN '+1-555-1005'
    WHEN o.name = 'Digital Dynamics Corp' THEN '+1-555-1006'
  END as phone,
  true as is_primary,
  '57cc8691-3095-4d5c-9d2b-5d98af61ea2a' as created_by
FROM organizations o
WHERE o.name IN ('Acme Corporation', 'GlobalTech Solutions', 'Innovative Systems Inc', 'Enterprise Partners LLC', 'TechStart Ventures', 'Digital Dynamics Corp')
ON CONFLICT (organization_id, full_name) DO NOTHING;