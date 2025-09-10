import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Subscribes to comments, likes and messages and triggers UI/browser notifications
export const useNotifications = () => {
  const { user } = useAuth();

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
              const text = (like as { description?: string }).description || 'Someone liked your content';
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
};
