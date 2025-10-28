-- Migration: Create Jobs Table
-- Date: 2025-10-28

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('remote', 'local', 'hybrid')),
  
  -- Skills
  required_skills TEXT[] NOT NULL,
  optional_skills TEXT[],
  experience_level TEXT CHECK (experience_level IN ('entry', 'intermediate', 'expert', 'any')),
  
  -- Location
  location_city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION,
  
  -- Compensation
  pay_rate_min DECIMAL(10, 2),
  pay_rate_max DECIMAL(10, 2),
  pay_rate_currency TEXT DEFAULT 'USD',
  pay_rate_type TEXT CHECK (pay_rate_type IN ('hourly', 'daily', 'weekly', 'monthly', 'fixed', 'negotiable')),
  
  -- Details
  duration_type TEXT CHECK (duration_type IN ('one-time', 'short-term', 'long-term', 'permanent')),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'urgent')),
  service_categories TEXT[],
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'filled', 'closed', 'cancelled')),
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status) WHERE status = 'open';
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_required_skills ON public.jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_location ON public.jobs(latitude, longitude) WHERE latitude IS NOT NULL;
