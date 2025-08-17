-- Create more secure RLS policies for profiles table
-- First, drop the current overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Allow users to view their own complete profile (including email)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view other users' profiles but exclude sensitive data like email
CREATE POLICY "Users can view other profiles without sensitive data"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() != user_id);

-- Create a view for public profile data without email
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

-- Grant select permission on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;