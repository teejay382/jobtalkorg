-- Allow public read access to profiles so names/avatars are visible app-wide
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);