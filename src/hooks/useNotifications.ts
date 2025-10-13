import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Notification = {
  id: string;
  type: 'comment' | 'like' | 'message';
  content: string;
  created_at: string;
  user_id?: string;
  sender_id?: string;
};

// Subscribes to comments, likes and messages and triggers UI/browser notifications
export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Get recent messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .neq('sender_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        // Get recent likes
        const { data: likes } = await supabase
          .from('video_likes')
          .select('id, created_at, user_id')
          .neq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        // Get recent comments
        const { data: comments } = await supabase
          .from('comments')
          .select('id, content, created_at, user_id')
          .neq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        const allNotifications: Notification[] = [
          ...(messages?.map(msg => ({
            id: msg.id,
            type: 'message' as const,
            content: msg.content || 'New message',
            created_at: msg.created_at,
            sender_id: msg.sender_id,
          })) || []),
          ...(likes?.map(like => ({
            id: like.id,
            type: 'like' as const,
            content: 'Someone liked your content',
            created_at: like.created_at,
            user_id: like.user_id,
          })) || []),
          ...(comments?.map(comment => ({
            id: comment.id,
            type: 'comment' as const,
            content: comment.content || 'New comment',
            created_at: comment.created_at,
            user_id: comment.user_id,
          })) || []),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setNotifications(allNotifications);
        setUnreadCount(Math.min(allNotifications.length, 99));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const commentChannel = supabase
      .channel('notifications-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const comment = payload.new as Database['public']['Tables']['comments']['Row'];
          try {
            if (comment.user_id !== user.id) {
              const newNotification: Notification = {
                id: comment.id,
                type: 'comment',
                content: comment.content || 'New comment',
                created_at: comment.created_at,
                user_id: comment.user_id,
              };
              setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
              setUnreadCount(prev => Math.min(prev + 1, 99));
              const text = comment.content || 'New comment';
              toast({ title: 'New comment', description: text });
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New comment', { body: text });
              }
            }
          } catch (e) {
            // ignore
          }
        }
      )
      .subscribe();

    const likeChannel = supabase
      .channel('notifications-likes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'video_likes' },
        (payload) => {
          const like = payload.new as unknown;
          try {
            const userId = (like as { user_id?: string }).user_id;
            if (userId && userId !== user.id) {
              const newNotification: Notification = {
                id: (like as { id: string }).id,
                type: 'like',
                content: 'Someone liked your content',
                created_at: (like as { created_at: string }).created_at,
                user_id: userId,
              };
              setNotifications(prev => [newNotification, ...prev].slice(0, 50));
              setUnreadCount(prev => Math.min(prev + 1, 99));
              const text = 'Someone liked your content';
              toast({ title: 'New like', description: text });
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New like', { body: text });
              }
            }
          } catch (e) {
            // ignore
          }
        }
      )
      .subscribe();

    const messageChannel = supabase
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Database['public']['Tables']['messages']['Row'];
          try {
            if (msg.sender_id !== user.id) {
              const newNotification: Notification = {
                id: msg.id,
                type: 'message',
                content: msg.content || 'New message',
                created_at: msg.created_at,
                sender_id: msg.sender_id,
              };
              setNotifications(prev => [newNotification, ...prev].slice(0, 50));
              setUnreadCount(prev => Math.min(prev + 1, 99));
              const text = msg.content || 'New message';
              toast({ title: 'New message', description: text });
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New message', { body: text });
              }
            }
          } catch (e) {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(likeChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [user]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return { unreadCount, notifications, markAsRead };
};
