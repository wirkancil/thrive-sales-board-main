-- Allow department heads to login without approval restrictions
-- Update any existing department heads to ensure they don't get approval restrictions
UPDATE public.user_profiles 
SET is_active = true
WHERE role = 'department_head';

-- Create function to auto-assign department_head role for specific email patterns
CREATE OR REPLACE FUNCTION public.handle_dept_head_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Check if user email suggests they should be a department head
  -- You can customize this logic based on your needs
  IF NEW.email LIKE '%dept%' OR NEW.email LIKE '%department%' OR NEW.email LIKE '%head%' THEN
    -- Update the profile to department_head role
    UPDATE public.user_profiles 
    SET role = 'department_head', is_active = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for department head auto-assignment
DROP TRIGGER IF EXISTS on_dept_head_signup ON auth.users;
CREATE TRIGGER on_dept_head_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_dept_head_signup();