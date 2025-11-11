-- Migration: JobTolk Algorithm System (JTS)
-- Date: 2025-11-08
-- Description: Core algorithm infrastructure for intelligent matching
-- Includes: embeddings, JTS scores, engagement tracking, discovery feed support

-- Enable pgvector extension for embeddings (vector similarity search)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- EMBEDDINGS TABLES
-- ============================================================================

-- Skill Embeddings: Vector representations of skills for semantic matching
CREATE TABLE IF NOT EXISTS public.skill_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_text TEXT NOT NULL UNIQUE,
  embedding vector(1536), -- OpenAI ada-002 dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_embeddings_vector ON public.skill_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Profile Embeddings: Combined representation of user's skills and experience
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  skills_embedding vector(1536),
  bio_embedding vector(1536),
  combined_embedding vector(1536), -- Weighted combination
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profile_embeddings_combined ON public.profile_embeddings 
USING ivfflat (combined_embedding vector_cosine_ops);

-- Job Embeddings: Vector representation of job requirements
CREATE TABLE IF NOT EXISTS public.job_embeddings (
  job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  requirements_embedding vector(1536),
  description_embedding vector(1536),
  combined_embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_embeddings_combined ON public.job_embeddings 
USING ivfflat (combined_embedding vector_cosine_ops);

-- Post/Content Embeddings: For discovery feed ranking
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  content_id UUID PRIMARY KEY, -- video_id or post_id
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'post', 'portfolio')),
  text_embedding vector(1536),
  tags_embedding vector(1536),
  combined_embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_embeddings_combined ON public.content_embeddings 
USING ivfflat (combined_embedding vector_cosine_ops);
CREATE INDEX idx_content_embeddings_type ON public.content_embeddings(content_type);

-- ============================================================================
-- JOBTOLK SCORE (JTS) TABLES
-- ============================================================================

-- User JTS Scores: Comprehensive scoring for each user
CREATE TABLE IF NOT EXISTS public.user_jts_scores (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Base Scores (0-100 scale)
  skill_match_avg DECIMAL(5, 2) DEFAULT 50.0,
  engagement_score DECIMAL(5, 2) DEFAULT 50.0,
  credibility_score DECIMAL(5, 2) DEFAULT 50.0,
  recency_boost DECIMAL(5, 2) DEFAULT 0.0,
  
  -- Overall JTS Score
  total_jts DECIMAL(5, 2) DEFAULT 50.0,
  
  -- Component Details
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  avg_watch_time DECIMAL(5, 2) DEFAULT 0.0,
  
  -- Credibility Metrics
  is_verified BOOLEAN DEFAULT FALSE,
  jobs_completed INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0.0,
  response_time_hours DECIMAL(8, 2) DEFAULT 0.0,
  
  -- Activity Signals
  posts_last_30_days INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  consistency_score DECIMAL(5, 2) DEFAULT 0.0, -- Based on regular posting
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_jts_total ON public.user_jts_scores(total_jts DESC);
CREATE INDEX idx_user_jts_engagement ON public.user_jts_scores(engagement_score DESC);
CREATE INDEX idx_user_jts_credibility ON public.user_jts_scores(credibility_score DESC);

-- Job-User Match Scores: Cached JTS scores for specific job matches
CREATE TABLE IF NOT EXISTS public.job_match_jts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- JTS Components
  skill_match_score DECIMAL(5, 2) NOT NULL,
  engagement_score DECIMAL(5, 2) NOT NULL,
  credibility_score DECIMAL(5, 2) NOT NULL,
  recency_boost DECIMAL(5, 2) NOT NULL,
  
  -- Overall Score
  total_jts DECIMAL(5, 2) NOT NULL,
  
  -- Additional Context
  location_score DECIMAL(5, 2),
  embedding_similarity DECIMAL(5, 4), -- Cosine similarity from vectors
  
  -- Explanation Data (for transparency)
  explanation JSONB,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

CREATE INDEX idx_job_match_jts_job ON public.job_match_jts(job_id, total_jts DESC);
CREATE INDEX idx_job_match_jts_user ON public.job_match_jts(user_id, total_jts DESC);
CREATE INDEX idx_job_match_jts_calculated ON public.job_match_jts(calculated_at);

-- ============================================================================
-- ENGAGEMENT TRACKING
-- ============================================================================

-- Enhanced User Interactions (extends existing table if needed)
CREATE TABLE IF NOT EXISTS public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'like', 'comment', 'share', 'click', 'apply', 'save', 
    'contact', 'hire', 'watch', 'skip', 'report'
  )),
  
  target_type TEXT NOT NULL CHECK (target_type IN ('video', 'post', 'job', 'profile', 'portfolio')),
  target_id UUID NOT NULL,
  
  -- Engagement Details
  duration_seconds INTEGER, -- For watch time
  completion_rate DECIMAL(5, 2), -- % of video watched
  source TEXT, -- 'feed', 'search', 'profile', 'recommendation'
  
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engagement_user ON public.engagement_events(user_id, created_at DESC);
CREATE INDEX idx_engagement_target ON public.engagement_events(target_type, target_id);
CREATE INDEX idx_engagement_type ON public.engagement_events(event_type, created_at DESC);

-- ============================================================================
-- DISCOVERY FEED TABLES
-- ============================================================================

-- Feed Rankings: Pre-computed personalized feed for each user
CREATE TABLE IF NOT EXISTS public.feed_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'post', 'job', 'profile')),
  
  -- Ranking Scores
  relevance_score DECIMAL(5, 2) NOT NULL,
  engagement_score DECIMAL(5, 2) NOT NULL,
  freshness_score DECIMAL(5, 2) NOT NULL,
  diversity_score DECIMAL(5, 2) NOT NULL,
  local_score DECIMAL(5, 2), -- For local content boost
  
  -- Combined Score
  total_score DECIMAL(5, 2) NOT NULL,
  
  -- Context
  is_local BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  explanation JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Cache expiration
  
  UNIQUE(user_id, content_id)
);

CREATE INDEX idx_feed_rankings_user_score ON public.feed_rankings(user_id, total_score DESC, created_at DESC);
CREATE INDEX idx_feed_rankings_expires ON public.feed_rankings(expires_at) WHERE expires_at IS NOT NULL;

-- Discovery Feed Cache: Batch pre-computed feeds
CREATE TABLE IF NOT EXISTS public.feed_cache (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  feed_data JSONB NOT NULL, -- Array of ranked content IDs with scores
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_feed_cache_expires ON public.feed_cache(expires_at);

-- ============================================================================
-- EXPLAINABLE RANKING LOGS
-- ============================================================================

-- Ranking Explanations: For transparency and debugging
CREATE TABLE IF NOT EXISTS public.ranking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  log_type TEXT NOT NULL CHECK (log_type IN ('job_match', 'feed_rank', 'search_result', 'recommendation')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  
  -- Scoring Breakdown
  score_components JSONB NOT NULL, -- {skill_match: 85, engagement: 70, ...}
  total_score DECIMAL(5, 2) NOT NULL,
  ranking_position INTEGER,
  
  -- Explanation
  explanation_text TEXT,
  factors JSONB, -- {positive: [...], negative: [...], neutral: [...]}
  
  -- Context
  search_query TEXT,
  filters_applied JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ranking_logs_user ON public.ranking_logs(user_id, created_at DESC);
CREATE INDEX idx_ranking_logs_target ON public.ranking_logs(target_id, log_type);
CREATE INDEX idx_ranking_logs_created ON public.ranking_logs(created_at DESC);

-- ============================================================================
-- ALGORITHM CONFIGURATION
-- ============================================================================

-- Algorithm Settings: Configurable weights and thresholds
CREATE TABLE IF NOT EXISTS public.algorithm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE,
  config_type TEXT NOT NULL CHECK (config_type IN ('jts_weights', 'feed_weights', 'threshold', 'feature_flag')),
  
  config_value JSONB NOT NULL,
  description TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default JTS Weights
INSERT INTO public.algorithm_config (config_name, config_type, config_value, description)
VALUES 
  ('jts_weights_v1', 'jts_weights', 
   '{"skill_match": 0.35, "engagement": 0.25, "credibility": 0.25, "recency": 0.15}'::jsonb,
   'Default JTS formula weights'),
  
  ('feed_weights_v1', 'feed_weights',
   '{"relevance": 0.30, "engagement": 0.25, "freshness": 0.20, "diversity": 0.15, "local": 0.10}'::jsonb,
   'Default discovery feed weights'),
  
  ('matching_threshold', 'threshold',
   '{"min_skill_match": 30.0, "min_jts": 40.0, "min_embedding_similarity": 0.5}'::jsonb,
   'Minimum thresholds for showing matches')
ON CONFLICT (config_name) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update user JTS score
CREATE OR REPLACE FUNCTION public.update_user_jts_score(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_skill_match DECIMAL(5, 2);
  v_engagement DECIMAL(5, 2);
  v_credibility DECIMAL(5, 2);
  v_recency DECIMAL(5, 2);
  v_total_jts DECIMAL(5, 2);
  v_weights JSONB;
BEGIN
  -- Get current weights
  SELECT config_value INTO v_weights
  FROM public.algorithm_config
  WHERE config_name = 'jts_weights_v1' AND is_active = TRUE;
  
  -- Calculate engagement score (normalized)
  SELECT 
    LEAST(100.0, GREATEST(0.0,
      (COALESCE(SUM(CASE WHEN event_type = 'like' THEN 3 ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN event_type = 'comment' THEN 5 ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN event_type = 'share' THEN 10 ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0)) / 10.0
    ))
  INTO v_engagement
  FROM public.engagement_events
  WHERE target_id IN (
    SELECT id FROM public.videos WHERE user_id = p_user_id
  ) AND created_at > NOW() - INTERVAL '30 days';
  
  v_engagement := COALESCE(v_engagement, 50.0);
  
  -- Calculate credibility score
  SELECT 
    ((COALESCE(us.avg_rating, 2.5) / 5.0) * 40.0) +
    (CASE WHEN us.total_ratings >= 5 THEN 20.0
          WHEN us.total_ratings >= 1 THEN 10.0
          ELSE 0.0 END) +
    (CASE WHEN p.onboarding_completed THEN 20.0 ELSE 0.0 END) +
    (LEAST(20.0, (us.total_jobs_completed * 2.0)))
  INTO v_credibility
  FROM public.profiles p
  LEFT JOIN public.user_statistics us ON us.user_id = p.user_id
  WHERE p.user_id = p_user_id;
  
  v_credibility := COALESCE(v_credibility, 50.0);
  
  -- Calculate recency boost
  SELECT 
    CASE 
      WHEN MAX(created_at) > NOW() - INTERVAL '24 hours' THEN 15.0
      WHEN MAX(created_at) > NOW() - INTERVAL '7 days' THEN 10.0
      WHEN MAX(created_at) > NOW() - INTERVAL '30 days' THEN 5.0
      ELSE 0.0
    END
  INTO v_recency
  FROM public.videos
  WHERE user_id = p_user_id;
  
  v_recency := COALESCE(v_recency, 0.0);
  
  -- Calculate skill match average (placeholder, would need specific job context)
  v_skill_match := 50.0;
  
  -- Calculate total JTS
  v_total_jts := 
    (v_skill_match * (v_weights->>'skill_match')::DECIMAL) +
    (v_engagement * (v_weights->>'engagement')::DECIMAL) +
    (v_credibility * (v_weights->>'credibility')::DECIMAL) +
    (v_recency * (v_weights->>'recency')::DECIMAL);
  
  -- Upsert JTS score
  INSERT INTO public.user_jts_scores (
    user_id, skill_match_avg, engagement_score, credibility_score, 
    recency_boost, total_jts, updated_at
  )
  VALUES (
    p_user_id, v_skill_match, v_engagement, v_credibility, 
    v_recency, v_total_jts, NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    skill_match_avg = v_skill_match,
    engagement_score = v_engagement,
    credibility_score = v_credibility,
    recency_boost = v_recency,
    total_jts = v_total_jts,
    updated_at = NOW();
END;
$$;

-- Calculate vector similarity between profile and job
CREATE OR REPLACE FUNCTION public.calculate_embedding_similarity(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS DECIMAL(5, 4)
LANGUAGE plpgsql
AS $$
DECLARE
  v_similarity DECIMAL(5, 4);
BEGIN
  SELECT 
    1 - (pe.combined_embedding <=> je.combined_embedding)
  INTO v_similarity
  FROM public.profile_embeddings pe
  CROSS JOIN public.job_embeddings je
  WHERE pe.user_id = p_user_id AND je.job_id = p_job_id;
  
  RETURN COALESCE(v_similarity, 0.5);
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.skill_embeddings IS 'Vector embeddings for semantic skill matching';
COMMENT ON TABLE public.user_jts_scores IS 'JobTolk Score (JTS) - comprehensive user ranking metric';
COMMENT ON TABLE public.ranking_logs IS 'Explainable AI logs for transparency and debugging';
COMMENT ON TABLE public.feed_rankings IS 'Personalized discovery feed rankings';
