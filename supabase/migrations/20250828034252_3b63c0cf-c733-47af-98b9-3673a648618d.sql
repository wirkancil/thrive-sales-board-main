-- Create missing profile for authenticated user
INSERT INTO user_profiles (id, full_name, role, created_at)
VALUES ('f0bf2c91-cbd4-4406-81f1-162022b0e8de', 'Suli', 'admin', NOW());