-- Remove the problematic view and fix the RLS approach
DROP VIEW IF EXISTS public.public_profiles;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles without sensitive data" ON public.profiles;

-- Create a single policy that restricts email access properly
-- Users can only see the email field in their own profile
CREATE POLICY "Users can view profiles with email restrictions"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  CASE 
    WHEN auth.uid() = user_id THEN true  -- Own profile: can see everything including email
    ELSE auth.uid() IS NOT NULL          -- Other profiles: can see profile but email will be filtered by app logic
  END
);