import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { notificationSound } from '@/utils/notificationSound';

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
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      if (typeof Notification === 'undefined') return;
      
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        try {
          const permission = await Notification.requestPermission();
          setPermissionGranted(permission === 'granted');
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    };

    requestPermission();
  }, []);

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
            
            // Play notification sound
            notificationSound.playNotificationSound(notification.type as any);
            
            // Show toast with icon based on type
            const getToastIcon = () => {
              switch (notification.type) {
                case 'message': return '💬';
                case 'like': return '❤️';
                case 'comment': return '💭';
                default: return '🔔';
              }
            };

            toast({ 
              title: `${getToastIcon()} ${notification.title}`, 
              description: notification.content,
              duration: 4000,
            });
            
            // Show browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              const browserNotif = new Notification(notification.title, { 
                body: notification.content,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: notification.type,
                requireInteraction: false,
                silent: false, // Allow sound from browser
              });

              // Close notification after 5 seconds
              setTimeout(() => browserNotif.close(), 5000);

              // Handle notification click
              browserNotif.onclick = () => {
                window.focus();
                if (notification.link) {
                  window.location.href = notification.link;
                }
                browserNotif.close();
              };
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
    refetch: fetchNotifications,
    permissionGranted,
    soundEnabled: notificationSound.isEnabled(),
    setSoundEnabled: (enabled: boolean) => notificationSound.setEnabled(enabled),
  };
};
