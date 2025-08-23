-- Remove the placeholder function and create a proper solution
DROP FUNCTION IF EXISTS public.is_profile_query_safe();

-- Drop the existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view limited profile data of others" ON public.profiles; 

-- Create a security definer function to check if user can access sensitive data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_profile_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT auth.uid() = target_user_id;
$$;

-- Policy 1: Users can always view their own profile (including email)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can view public profile data of others (excluding email and sensitive fields)
-- This relies on application logic to not select sensitive fields
CREATE POLICY "Users can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != user_id
);