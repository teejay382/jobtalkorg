
-- First, let's check if there are any existing foreign key constraints
-- and then add the proper foreign key relationship between videos and profiles

-- Add foreign key constraint to link videos.user_id to profiles.user_id
ALTER TABLE public.videos 
ADD CONSTRAINT videos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Enable realtime for profiles table if not already enabled
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
