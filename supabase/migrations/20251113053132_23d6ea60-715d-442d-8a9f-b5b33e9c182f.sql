-- Add foreign key relationship between videos and profiles
-- This will allow nested queries to work properly

ALTER TABLE videos 
DROP CONSTRAINT IF EXISTS videos_user_id_fkey;

ALTER TABLE videos
ADD CONSTRAINT videos_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(user_id) 
ON DELETE CASCADE;