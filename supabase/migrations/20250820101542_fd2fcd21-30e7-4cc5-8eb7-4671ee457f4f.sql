-- Create a secure public view for profiles that excludes sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  bio,
  account_type,
  company_name,
  skills,
  avatar_url,
  onboarding_completed,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Create RLS policy for the public view
CREATE POLICY "Anyone can view public profiles" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update the existing profiles table policies to be more restrictive
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Now only allow users to view their own full profile from the main table
-- Others must use the public_profiles view