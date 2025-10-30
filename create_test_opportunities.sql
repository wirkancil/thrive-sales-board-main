-- Create test opportunities with proper names
-- Run this in your Supabase SQL editor to create sample data

-- First, get a user ID to use as owner
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first available user profile
    SELECT user_id INTO test_user_id 
    FROM user_profiles 
    WHERE role IN ('account_manager', 'manager', 'admin') 
    LIMIT 1;
    
    -- If we found a user, create test opportunities
    IF test_user_id IS NOT NULL THEN
        INSERT INTO opportunities (name, description, amount, currency, stage, status, owner_id, created_at)
        VALUES 
            ('Enterprise Software Deal', 'Large enterprise software implementation project', 1500000, 'IDR', 'Prospecting', 'open', test_user_id, NOW()),
            ('Cloud Migration Project', 'Complete cloud infrastructure migration', 2500000, 'IDR', 'Qualification', 'open', test_user_id, NOW()),
            ('Digital Transformation Initiative', 'Company-wide digital transformation', 3000000, 'IDR', 'Discovery', 'open', test_user_id, NOW()),
            ('CRM Implementation', 'Customer relationship management system setup', 800000, 'IDR', 'Presentation', 'open', test_user_id, NOW()),
            ('Security Audit Services', 'Comprehensive security assessment and implementation', 1200000, 'IDR', 'Proposal', 'open', test_user_id, NOW());
        
        RAISE NOTICE 'Created 5 test opportunities for user %', test_user_id;
    ELSE
        RAISE NOTICE 'No user profiles found to assign opportunities to';
    END IF;
END $$;

-- Verify the created opportunities
SELECT id, name, stage, status, amount, currency, owner_id, created_at 
FROM opportunities 
WHERE name IN (
    'Enterprise Software Deal',
    'Cloud Migration Project', 
    'Digital Transformation Initiative',
    'CRM Implementation',
    'Security Audit Services'
)
ORDER BY created_at DESC;