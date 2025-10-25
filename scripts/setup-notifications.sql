-- =====================================================
-- Quick setup verification for notifications system
-- Run this in Supabase SQL Editor to verify setup
-- =====================================================

-- 1. Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
) as notifications_table_exists;

-- 2. Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('comment_notification_trigger', 'like_notification_trigger', 'message_notification_trigger');

-- 3. Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('create_comment_notification', 'create_like_notification', 'create_message_notification', 'mark_notification_read', 'mark_all_notifications_read');

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- 5. Check if real-time is enabled
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- =====================================================
-- Manual test: Create a test notification
-- =====================================================

-- Replace USER_ID with your actual user ID from auth.users
-- INSERT INTO notifications (user_id, type, title, content, link)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'comment',
--   'Test Notification',
--   'This is a test notification',
--   '/'
-- );

-- =====================================================
-- If anything is missing, apply the migration:
-- Run: supabase/migrations/20250125000000_notifications_system.sql
-- =====================================================
