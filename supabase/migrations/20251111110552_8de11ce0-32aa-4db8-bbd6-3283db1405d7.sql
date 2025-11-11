-- Add missing columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Notification',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS sender_id UUID,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Update existing message column to content (if needed)
UPDATE notifications SET content = message WHERE content IS NULL AND message IS NOT NULL;

-- Create function to create comment notifications
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get video owner
  SELECT user_id INTO video_owner_id
  FROM videos
  WHERE id = NEW.video_id;
  
  -- Don't notify if user comments on their own video
  IF video_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT COALESCE(full_name, username, email) INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification for video owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id,
    is_read
  )
  VALUES (
    video_owner_id,
    'comment',
    'New Comment',
    commenter_name || ' commented on your video',
    '/video/' || NEW.video_id,
    NEW.id,
    NEW.user_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comments
DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Create function to create like notifications
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Get video owner
  SELECT user_id INTO video_owner_id
  FROM videos
  WHERE id = NEW.video_id;
  
  -- Don't notify if user likes their own video
  IF video_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT COALESCE(full_name, username, email) INTO liker_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification for video owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id,
    is_read
  )
  VALUES (
    video_owner_id,
    'like',
    'New Like',
    liker_name || ' liked your video',
    '/video/' || NEW.video_id,
    NEW.video_id,
    NEW.user_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes (using video_likes table)
DROP TRIGGER IF EXISTS like_notification_trigger ON video_likes;
CREATE TRIGGER like_notification_trigger
  AFTER INSERT ON video_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Create function to create message notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  recipient_id UUID;
BEGIN
  -- Get sender's name
  SELECT COALESCE(full_name, username, email) INTO sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  -- Determine recipient from conversation
  SELECT 
    CASE 
      WHEN participant_1 = NEW.sender_id THEN participant_2
      ELSE participant_1
    END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Don't notify if no recipient found
  IF recipient_id IS NULL OR recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for the recipient
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id,
    is_read
  )
  VALUES (
    recipient_id,
    'message',
    'New Message',
    sender_name || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    '/chat?conversation_id=' || NEW.conversation_id,
    NEW.id,
    NEW.sender_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for messages
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Create functions for marking notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for notifications
DROP POLICY IF EXISTS read_own_notifications ON notifications;
DROP POLICY IF EXISTS insert_own_notifications ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure notifications table has proper indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;