-- Migration: Add role and username to profiles
-- Timestamp: 2025-09-18 00:00:00

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

-- Optional: you may want to add an index on user_id for faster lookups (if not present)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- Optional: consider a CHECK constraint if you want to limit role values to 'freelancer'/'employer'
-- ALTER TABLE public.profiles
--   ADD CONSTRAINT chk_profiles_role
--   CHECK (role IN ('freelancer', 'employer'));
