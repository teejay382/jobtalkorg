-- Allow public read access to non-sensitive profile data for displaying names/avatars
-- Enables feeds, chat, and search to resolve 'User xxxx' placeholders
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);