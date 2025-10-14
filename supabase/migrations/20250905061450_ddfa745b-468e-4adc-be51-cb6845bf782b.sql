-- Add 'go_show' to the activity_type enum
ALTER TYPE activity_type ADD VALUE 'go_show';

-- Update getActivityIcon function to handle go_show
CREATE OR REPLACE FUNCTION get_activity_icon(activity_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    CASE activity_type
        WHEN 'call' THEN RETURN '📞';
        WHEN 'meeting_online' THEN RETURN '💻';
        WHEN 'visit' THEN RETURN '🏢';
        WHEN 'go_show' THEN RETURN '🎯';
        ELSE RETURN '📞';
    END CASE;
END;
$$;