-- =====================================================
-- Notifications System with Read/Unread State
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like', 'message', 'follow', 'hire')),
  title TEXT NOT NULL,
  content TEXT,
  link TEXT, -- URL to navigate when clicked
  reference_id UUID, -- ID of the related item (comment_id, video_id, etc)
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Indexes for performance
  INDEX idx_notifications_user_id ON notifications(user_id),
  INDEX idx_notifications_created_at ON notifications(created_at DESC),
  INDEX idx_notifications_is_read ON notifications(is_read)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "notifications_select_policy"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only mark their own notifications as read
CREATE POLICY "notifications_update_policy"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_policy"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- Functions to create notifications automatically
-- =====================================================

-- Function to create notification for new comment
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
  
  -- Don't notify if commenting on own video
  IF video_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT COALESCE(full_name, username, 'Someone') INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id
  ) VALUES (
    video_owner_id,
    'comment',
    'New comment',
    commenter_name || ' commented on your video',
    '/video/' || NEW.video_id,
    NEW.id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new like
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
  
  -- Don't notify if liking own video
  IF video_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker name
  SELECT COALESCE(full_name, username, 'Someone') INTO liker_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id
  ) VALUES (
    video_owner_id,
    'like',
    'New like',
    liker_name || ' liked your video',
    '/video/' || NEW.video_id,
    NEW.video_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_id UUID;
BEGIN
  -- Get conversation
  SELECT id, 
    CASE 
      WHEN participant_1 = NEW.sender_id THEN participant_2
      ELSE participant_1
    END INTO conversation_id, recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Don't notify if sending to self
  IF recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT COALESCE(full_name, username, 'Someone') INTO sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    reference_id,
    sender_id
  ) VALUES (
    recipient_id,
    'message',
    'New message',
    sender_name || ': ' || SUBSTRING(NEW.content, 1, 50),
    '/chat?user=' || NEW.sender_id,
    NEW.id,
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
DROP TRIGGER IF EXISTS like_notification_trigger ON video_likes;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;

-- Create triggers
CREATE TRIGGER comment_notification_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

CREATE TRIGGER like_notification_trigger
AFTER INSERT ON video_likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- =====================================================
-- Helper function to mark notifications as read
-- =====================================================

CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications IS 'Stores user notifications with read/unread state';
COMMENT ON FUNCTION create_comment_notification() IS 'Automatically creates notification when someone comments on a video';
COMMENT ON FUNCTION create_like_notification() IS 'Automatically creates notification when someone likes a video';
COMMENT ON FUNCTION create_message_notification() IS 'Automatically creates notification when someone sends a message';
