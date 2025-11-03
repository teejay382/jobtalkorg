-- First, let's check what we have and consolidate the jobs tables
-- Drop the older/simpler jobs table and keep the more complete one with matching features

-- Check if there are any important records in the old jobs table that need migration
-- If the old table has data, we should migrate it first

-- Drop the old simple jobs table (the one at line 68 of types)
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Now recreate a single, comprehensive jobs table with all needed fields
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'remote',
  category TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  location TEXT,
  requirements TEXT[],
  video_url TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Employers can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = employer_id);

-- Add updated_at trigger
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);