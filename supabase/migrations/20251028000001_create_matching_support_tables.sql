-- Migration: Create Matching Support Tables
-- Date: 2025-10-28

-- Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  cover_letter TEXT,
  proposed_rate DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(job_id, applicant_id)
);

CREATE INDEX idx_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_applications_applicant_id ON public.job_applications(applicant_id);

-- User Interactions
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('job', 'profile', 'video')),
  target_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'apply', 'save', 'contact', 'hire', 'accept')),
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_interactions_target ON public.user_interactions(target_type, target_id);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(job_id, rated_user_id, rater_user_id)
);

CREATE INDEX idx_ratings_rated_user ON public.ratings(rated_user_id);

-- User Statistics
CREATE TABLE IF NOT EXISTS public.user_statistics (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  profile_completeness_score DECIMAL(5, 2) DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  total_applications_sent INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  trust_score DECIMAL(5, 2) DEFAULT 50,
  
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_stats_trust_score ON public.user_statistics(trust_score DESC);

-- Match Scores Cache
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  skill_score DECIMAL(5, 2) NOT NULL,
  location_score DECIMAL(5, 2) NOT NULL,
  reputation_score DECIMAL(5, 2) NOT NULL,
  total_score DECIMAL(5, 2) NOT NULL,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_match_scores_job_id ON public.match_scores(job_id, total_score DESC);
