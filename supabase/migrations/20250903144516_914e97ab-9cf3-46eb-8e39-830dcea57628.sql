-- Create jobs table for job postings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  category TEXT,
  job_type TEXT CHECK (job_type IN ('remote', 'local', 'hybrid')) DEFAULT 'remote',
  location TEXT,
  video_url TEXT,
  requirements TEXT[],
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs
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

-- Create indexes for better search performance
CREATE INDEX idx_jobs_category ON public.jobs (category);
CREATE INDEX idx_jobs_job_type ON public.jobs (job_type);
CREATE INDEX idx_jobs_budget ON public.jobs (budget_min, budget_max);
CREATE INDEX idx_jobs_created_at ON public.jobs (created_at DESC);

-- Create full-text search index
CREATE INDEX idx_jobs_search ON public.jobs USING gin(to_tsvector('english', title || ' ' || description));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();