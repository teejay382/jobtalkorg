-- Add indexes for optimized search performance on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON profiles USING gin(to_tsvector('english', COALESCE(username, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search ON profiles USING gin(to_tsvector('english', COALESCE(full_name, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_username_prefix ON profiles (username text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_prefix ON profiles (full_name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_service_categories ON profiles USING gin(service_categories);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_location_city ON profiles (location_city text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles (onboarding_completed);

-- Add indexes for optimized search performance on jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_jobs_title_prefix ON jobs (title text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_category_prefix ON jobs (category text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs (location text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);