import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Notification = {
  id: string;
  type: 'comment' | 'like' | 'message' | 'follow' | 'hire';
  title: string;
  content: string;
  link?: string | null;
  reference_id?: string | null;
  sender_id?: string | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
};

// Subscribes to comments, likes and messages and triggers UI/browser notifications
export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setNotifications(data as any as Notification[]);
        const unread = (data as any[]).filter((n: any) => !n.is_read).length;
        setUnreadCount(Math.min(unread, 99));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as Notification;
          try {
            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            setUnreadCount(prev => Math.min(prev + 1, 99));
            
            // Show toast
            toast({ 
              title: notification.title, 
              description: notification.content 
            });
            
            // Show browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(notification.title, { 
                body: notification.content 
              });
            }
          } catch (e) {
            console.error('Error handling notification:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_notification_read' as any, {
        notification_id: notificationId
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_all_notifications_read' as any);

      if (error) throw error;

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: now }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, notifications]);

  return { 
    unreadCount, 
    notifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};
