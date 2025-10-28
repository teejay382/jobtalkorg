-- Migration: Create Matching Algorithm Functions
-- Date: 2025-10-28

-- Calculate skill similarity
CREATE OR REPLACE FUNCTION public.calculate_skill_similarity(
  user_skills TEXT[],
  required_skills TEXT[]
)
RETURNS DECIMAL(5, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  matched_count INTEGER;
  total_required INTEGER;
BEGIN
  user_skills := (SELECT array_agg(LOWER(skill)) FROM unnest(user_skills) AS skill);
  required_skills := (SELECT array_agg(LOWER(skill)) FROM unnest(required_skills) AS skill);
  
  total_required := array_length(required_skills, 1);
  IF total_required IS NULL OR total_required = 0 THEN
    RETURN 100.0;
  END IF;
  
  matched_count := (
    SELECT COUNT(*)
    FROM unnest(required_skills) AS req_skill
    WHERE req_skill = ANY(user_skills)
  );
  
  RETURN (matched_count::DECIMAL / total_required::DECIMAL) * 100.0;
END;
$$;

-- Find matches for a job
CREATE OR REPLACE FUNCTION public.find_matches_for_job(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  location_city TEXT,
  avg_rating DECIMAL(3, 2),
  skill_score DECIMAL(5, 2),
  location_score DECIMAL(5, 2),
  reputation_score DECIMAL(5, 2),
  total_score DECIMAL(5, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  job_rec RECORD;
BEGIN
  SELECT * INTO job_rec FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN; END IF;
  
  RETURN QUERY
  WITH scored_profiles AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.bio,
      p.skills,
      p.location_city,
      COALESCE(us.avg_rating, 0.0) as avg_rating,
      
      -- Skill Score (40% weight)
      public.calculate_skill_similarity(
        COALESCE(p.skills, ARRAY[]::TEXT[]) || COALESCE(p.service_categories, ARRAY[]::TEXT[]),
        job_rec.required_skills
      ) as skill_score,
      
      -- Location Score (30% weight)
      CASE
        WHEN job_rec.job_type = 'remote' THEN 100.0
        WHEN job_rec.latitude IS NOT NULL AND p.latitude IS NOT NULL THEN
          CASE
            WHEN public.calculate_distance(job_rec.latitude, job_rec.longitude, p.latitude, p.longitude) <= 10 THEN 100.0
            WHEN public.calculate_distance(job_rec.latitude, job_rec.longitude, p.latitude, p.longitude) <= 25 THEN 80.0
            WHEN public.calculate_distance(job_rec.latitude, job_rec.longitude, p.latitude, p.longitude) <= 50 THEN 50.0
            ELSE 20.0
          END
        ELSE 50.0
      END as location_score,
      
      -- Reputation Score (30% weight)
      CASE
        WHEN us.total_ratings > 0 THEN ((us.avg_rating - 1.0) / 4.0) * 100.0
        ELSE 50.0
      END as reputation_score
      
    FROM public.profiles p
    LEFT JOIN public.user_statistics us ON us.user_id = p.user_id
    WHERE p.role = 'freelancer'
      AND p.onboarding_completed = TRUE
  )
  SELECT 
    sp.*,
    ((sp.skill_score * 0.4) + (sp.location_score * 0.3) + (sp.reputation_score * 0.3)) as total_score
  FROM scored_profiles sp
  WHERE sp.skill_score >= 40.0
  ORDER BY total_score DESC
  LIMIT p_limit;
END;
$$;

-- Find matching jobs for a user
CREATE OR REPLACE FUNCTION public.find_matches_for_user(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  description TEXT,
  job_type TEXT,
  required_skills TEXT[],
  location_city TEXT,
  pay_rate_min DECIMAL(10, 2),
  pay_rate_max DECIMAL(10, 2),
  urgency_level TEXT,
  employer_name TEXT,
  created_at TIMESTAMPTZ,
  skill_score DECIMAL(5, 2),
  location_score DECIMAL(5, 2),
  total_score DECIMAL(5, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  profile_rec RECORD;
BEGIN
  SELECT * INTO profile_rec FROM public.profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;
  
  RETURN QUERY
  WITH scored_jobs AS (
    SELECT 
      j.id,
      j.title,
      j.description,
      j.job_type,
      j.required_skills,
      j.location_city,
      j.pay_rate_min,
      j.pay_rate_max,
      j.urgency_level,
      p.full_name as employer_name,
      j.created_at,
      
      -- Skill Score
      public.calculate_skill_similarity(
        COALESCE(profile_rec.skills, ARRAY[]::TEXT[]) || COALESCE(profile_rec.service_categories, ARRAY[]::TEXT[]),
        j.required_skills
      ) as skill_score,
      
      -- Location Score
      CASE
        WHEN j.job_type = 'remote' THEN 100.0
        WHEN j.latitude IS NOT NULL AND profile_rec.latitude IS NOT NULL THEN
          CASE
            WHEN public.calculate_distance(j.latitude, j.longitude, profile_rec.latitude, profile_rec.longitude) <= 10 THEN 100.0
            WHEN public.calculate_distance(j.latitude, j.longitude, profile_rec.latitude, profile_rec.longitude) <= 25 THEN 80.0
            WHEN public.calculate_distance(j.latitude, j.longitude, profile_rec.latitude, profile_rec.longitude) <= 50 THEN 50.0
            ELSE 20.0
          END
        ELSE 50.0
      END as location_score
      
    FROM public.jobs j
    JOIN public.profiles p ON p.user_id = j.employer_id
    WHERE j.status = 'open'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
  )
  SELECT 
    sj.*,
    ((sj.skill_score * 0.6) + (sj.location_score * 0.4)) as total_score
  FROM scored_jobs sj
  WHERE sj.skill_score >= 30.0
  ORDER BY total_score DESC, sj.created_at DESC
  LIMIT p_limit;
END;
$$;
