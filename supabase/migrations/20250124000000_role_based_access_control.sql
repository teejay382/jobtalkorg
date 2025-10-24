-- =====================================================
-- JobTolk Hybrid Employment System - RLS Policies
-- Enforce role-based access control at database level
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "videos_select_policy" ON videos;
DROP POLICY IF EXISTS "videos_insert_policy" ON videos;
DROP POLICY IF EXISTS "videos_update_policy" ON videos;
DROP POLICY IF EXISTS "videos_delete_policy" ON videos;

-- =====================================================
-- VIDEOS TABLE POLICIES
-- =====================================================

-- Anyone can view all videos (public feed)
CREATE POLICY "videos_select_policy"
ON videos
FOR SELECT
USING (true);

-- Only FREELANCERS can upload videos
CREATE POLICY "videos_insert_policy"
ON videos
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.role = 'freelancer' OR profiles.account_type = 'freelancer')
  )
);

-- Only video owners can update their own videos
CREATE POLICY "videos_update_policy"
ON videos
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only video owners can delete their own videos
CREATE POLICY "videos_delete_policy"
ON videos
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Anyone can view profiles (for browsing freelancers)
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
USING (true);

-- Users can create their own profile on signup
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is a freelancer
CREATE OR REPLACE FUNCTION is_freelancer(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = user_uuid
    AND (role = 'freelancer' OR account_type = 'freelancer')
  );
END;
$$;

-- Function to check if user is an employer
CREATE OR REPLACE FUNCTION is_employer(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = user_uuid
    AND (role = 'employer' OR account_type = 'employer')
  );
END;
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT COALESCE(role, account_type) INTO user_role
  FROM profiles
  WHERE user_id = user_uuid;
  
  RETURN user_role;
END;
$$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on role/account_type for fast role checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index on videos user_id for ownership checks
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "videos_select_policy" ON videos IS 
'All users can view videos in the public feed';

COMMENT ON POLICY "videos_insert_policy" ON videos IS 
'Only freelancers can upload videos. Employers cannot upload.';

COMMENT ON POLICY "videos_update_policy" ON videos IS 
'Only video owners can update their videos';

COMMENT ON POLICY "videos_delete_policy" ON videos IS 
'Only video owners can delete their videos';

COMMENT ON FUNCTION is_freelancer(uuid) IS 
'Check if a user has freelancer role';

COMMENT ON FUNCTION is_employer(uuid) IS 
'Check if a user has employer role';

COMMENT ON FUNCTION get_user_role(uuid) IS 
'Get user role from profiles table';
