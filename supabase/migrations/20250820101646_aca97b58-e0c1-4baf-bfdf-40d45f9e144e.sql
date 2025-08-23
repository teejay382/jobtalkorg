-- Remove the policy that allows viewing other users' profile data
-- This will force all profile queries to only work for the user's own profile
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Verify only the safe policy remains
-- Users can now only view their own profiles from the profiles table
-- Application code must handle public profile display through careful field selection