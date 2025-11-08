-- =====================================================
-- JOBTOLK ALGORITHM SYSTEM - PHASE 1 SCHEMA
-- =====================================================

-- Enable pgvector extension for future embedding support
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. ENHANCE PROFILES TABLE
-- =====================================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS credibility_score DECIMAL(5,2) DEFAULT 50.0,
  ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS jts_score DECIMAL(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_engagements INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS response_time_avg INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS skill_embedding vector(1536);

-- Create indexes for algorithm performance
CREATE INDEX IF NOT EXISTS profiles_jts_score_idx ON profiles(jts_score DESC);
CREATE INDEX IF NOT EXISTS profiles_credibility_idx ON profiles(credibility_score DESC);
CREATE INDEX IF NOT EXISTS profiles_engagement_idx ON profiles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON profiles(last_active_at DESC);

-- =====================================================
-- 2. ENHANCE JOBS TABLE
-- =====================================================

ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS skill_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applicant_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS filled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS boost_until TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS jobs_urgency_idx ON jobs(urgency_level);
CREATE INDEX IF NOT EXISTS jobs_views_idx ON jobs(views_count DESC);
CREATE INDEX IF NOT EXISTS jobs_created_idx ON jobs(created_at DESC);

-- =====================================================
-- 3. CREATE ENGAGEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX engagements_user_idx ON engagements(user_id);
CREATE INDEX engagements_target_idx ON engagements(target_type, target_id);
CREATE INDEX engagements_created_idx ON engagements(created_at DESC);
CREATE INDEX engagements_action_idx ON engagements(action_type);

-- RLS Policies for engagements
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own engagements"
ON engagements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own engagements"
ON engagements FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE MATCHES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID NOT NULL,
  match_score DECIMAL(5,2) NOT NULL,
  skill_match_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  credibility_score DECIMAL(5,2),
  recency_boost DECIMAL(5,2),
  status TEXT DEFAULT 'suggested',
  explanation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, freelancer_id)
);

CREATE INDEX matches_job_idx ON matches(job_id);
CREATE INDEX matches_freelancer_idx ON matches(freelancer_id);
CREATE INDEX matches_score_idx ON matches(match_score DESC);
CREATE INDEX matches_status_idx ON matches(status);
CREATE INDEX matches_created_idx ON matches(created_at DESC);

-- RLS Policies for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view matches for their jobs"
ON matches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = matches.job_id 
    AND jobs.employer_id = auth.uid()
  )
);

CREATE POLICY "Freelancers can view their own matches"
ON matches FOR SELECT
USING (auth.uid() = freelancer_id);

CREATE POLICY "System can create matches"
ON matches FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update matches"
ON matches FOR UPDATE
USING (true);

-- =====================================================
-- 5. CREATE SKILL TAXONOMY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  parent_skill TEXT,
  synonyms TEXT[],
  skill_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX skill_taxonomy_category_idx ON skill_taxonomy(category);
CREATE INDEX skill_taxonomy_name_idx ON skill_taxonomy(skill_name);

-- RLS: Public read access
ALTER TABLE skill_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
ON skill_taxonomy FOR SELECT
USING (true);

-- =====================================================
-- 6. ALGORITHM FUNCTIONS
-- =====================================================

-- Function: Update Engagement Score
CREATE OR REPLACE FUNCTION update_engagement_score(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_views INTEGER;
  total_likes INTEGER;
  total_comments INTEGER;
  total_shares INTEGER;
  video_count INTEGER;
  normalized_score DECIMAL;
BEGIN
  -- Aggregate engagement metrics
  SELECT 
    COALESCE(SUM(v.views_count), 0),
    COALESCE(SUM(v.likes_count), 0),
    COALESCE(SUM(v.comments_count), 0),
    COUNT(*)
  INTO total_views, total_likes, total_comments, video_count
  FROM videos v
  WHERE v.user_id = target_user_id;
  
  -- Count shares from engagements
  SELECT COUNT(*) INTO total_shares
  FROM engagements
  WHERE target_type = 'video'
  AND action_type = 'share'
  AND target_id IN (SELECT id FROM videos WHERE user_id = target_user_id);
  
  -- Normalize to 0-100 scale with diminishing returns
  IF video_count = 0 THEN
    normalized_score := 0;
  ELSE
    normalized_score := LEAST(100, (
      (total_views * 0.1) +
      (total_likes * 2) +
      (total_comments * 5) +
      (total_shares * 10)
    ) / video_count);
  END IF;
  
  UPDATE profiles
  SET 
    engagement_score = normalized_score,
    total_views = total_views,
    total_engagements = total_likes + total_comments + total_shares,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

-- Function: Update Credibility Score
CREATE OR REPLACE FUNCTION update_credibility_score(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_verified BOOLEAN;
  comp_rate DECIMAL;
  resp_time INTEGER;
  account_age_days INTEGER;
  video_count INTEGER;
  final_score DECIMAL := 0;
BEGIN
  -- Get profile data
  SELECT 
    verified_at IS NOT NULL,
    COALESCE(p.completion_rate, 0),
    COALESCE(p.response_time_avg, 999999),
    EXTRACT(DAY FROM NOW() - p.created_at)
  INTO is_verified, comp_rate, resp_time, account_age_days
  FROM profiles p
  WHERE p.user_id = target_user_id;
  
  -- Get video count
  SELECT COUNT(*) INTO video_count
  FROM videos
  WHERE user_id = target_user_id;
  
  -- Base score starts at 50
  final_score := 50;
  
  -- Verified users get +20
  IF is_verified THEN
    final_score := final_score + 20;
  END IF;
  
  -- Completion rate adds up to +20
  final_score := final_score + (comp_rate * 0.2);
  
  -- Response time (fast = good)
  IF resp_time < 60 THEN
    final_score := final_score + 10;
  ELSIF resp_time < 360 THEN
    final_score := final_score + 5;
  END IF;
  
  -- Account age bonus (capped at +10)
  final_score := final_score + LEAST(10, account_age_days / 30);
  
  -- Has uploaded content bonus (+5)
  IF video_count > 0 THEN
    final_score := final_score + 5;
  END IF;
  
  -- Cap at 100
  final_score := LEAST(100, final_score);
  
  UPDATE profiles
  SET 
    credibility_score = final_score,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

-- Function: Update JTS Score (Jobtolk Score)
CREATE OR REPLACE FUNCTION update_jts_score(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  skill_avg DECIMAL;
  eng_score DECIMAL;
  cred_score DECIMAL;
  rec_boost DECIMAL;
  final_score DECIMAL;
BEGIN
  -- Get average skill match from recent matches
  SELECT COALESCE(AVG(skill_match_score), 50) INTO skill_avg
  FROM matches
  WHERE freelancer_id = target_user_id
  AND created_at > NOW() - INTERVAL '30 days';
  
  -- Get engagement score
  SELECT engagement_score INTO eng_score
  FROM profiles WHERE user_id = target_user_id;
  
  -- Get credibility score
  SELECT credibility_score INTO cred_score
  FROM profiles WHERE user_id = target_user_id;
  
  -- Recency boost: 15 points if posted in last 7 days
  SELECT CASE 
    WHEN MAX(created_at) > NOW() - INTERVAL '7 days' THEN 15
    ELSE 0
  END INTO rec_boost
  FROM videos
  WHERE user_id = target_user_id;
  
  IF rec_boost IS NULL THEN
    rec_boost := 0;
  END IF;
  
  -- Calculate JTS: weighted formula
  final_score := (
    (skill_avg * 0.35) +
    (COALESCE(eng_score, 0) * 0.25) +
    (COALESCE(cred_score, 50) * 0.25) +
    (rec_boost * 0.15)
  );
  
  -- Update profile
  UPDATE profiles
  SET 
    jts_score = final_score,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

-- Function: Calculate Skill Match (simple version for Phase 1)
CREATE OR REPLACE FUNCTION calculate_skill_match_simple(
  freelancer_skills TEXT[],
  freelancer_categories TEXT[],
  job_requirements TEXT[],
  job_category TEXT
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  job_skills TEXT[];
  candidate_skills TEXT[];
  matching_count INTEGER := 0;
  total_count INTEGER;
  match_score DECIMAL;
BEGIN
  -- Combine job requirements and category
  job_skills := COALESCE(job_requirements, ARRAY[]::TEXT[]) || ARRAY[COALESCE(job_category, '')];
  job_skills := array_remove(job_skills, '');
  job_skills := array_remove(job_skills, NULL);
  
  -- Combine freelancer skills and categories
  candidate_skills := COALESCE(freelancer_skills, ARRAY[]::TEXT[]) || COALESCE(freelancer_categories, ARRAY[]::TEXT[]);
  candidate_skills := array_remove(candidate_skills, '');
  candidate_skills := array_remove(candidate_skills, NULL);
  
  -- If either is empty, return default score
  IF array_length(job_skills, 1) IS NULL OR array_length(candidate_skills, 1) IS NULL THEN
    RETURN 50.0;
  END IF;
  
  -- Count matching skills (case-insensitive partial match)
  SELECT COUNT(*) INTO matching_count
  FROM unnest(job_skills) js
  WHERE EXISTS (
    SELECT 1 FROM unnest(candidate_skills) cs
    WHERE LOWER(cs) LIKE '%' || LOWER(js) || '%'
    OR LOWER(js) LIKE '%' || LOWER(cs) || '%'
  );
  
  -- Calculate percentage match
  total_count := array_length(job_skills, 1);
  match_score := (matching_count::DECIMAL / total_count) * 100;
  
  RETURN LEAST(100, match_score);
END;
$$;

-- Function: Track engagement
CREATE OR REPLACE FUNCTION track_engagement(
  p_user_id UUID,
  p_target_type TEXT,
  p_target_id UUID,
  p_action_type TEXT,
  p_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  engagement_id UUID;
BEGIN
  -- Insert engagement record
  INSERT INTO engagements (
    user_id,
    target_type,
    target_id,
    action_type,
    duration_seconds
  ) VALUES (
    p_user_id,
    p_target_type,
    p_target_id,
    p_action_type,
    p_duration_seconds
  )
  RETURNING id INTO engagement_id;
  
  -- Update target view count if it's a view action
  IF p_action_type = 'view' THEN
    IF p_target_type = 'video' THEN
      UPDATE videos SET views_count = views_count + 1 WHERE id = p_target_id;
    ELSIF p_target_type = 'job' THEN
      UPDATE jobs SET views_count = views_count + 1 WHERE id = p_target_id;
    END IF;
  END IF;
  
  RETURN engagement_id;
END;
$$;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger: Update last_active_at on profile updates
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_active_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_update_last_active
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

-- Trigger: Update match timestamp
CREATE OR REPLACE FUNCTION update_match_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER matches_update_timestamp
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_timestamp();