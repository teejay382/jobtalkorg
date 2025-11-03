import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, MessageCircle, Heart, MessageSquare } from 'lucide-react';

/**
 * Debug component to test notification system
 * Add to any page temporarily: import { NotificationTester } from '@/components/debug/NotificationTester';
 * Remove after testing
 */
export const NotificationTester = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testCreateNotification = async () => {
    if (!user) {
      setStatus('Error: Not logged in');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .insert({
          user_id: user.id,
          type: 'comment',
          title: 'Test Notification',
          content: 'This is a test notification created manually',
          link: '/',
          is_read: false
        })
        .select();

      if (error) throw error;
      
      if (data && data.length > 0 && 'id' in data[0]) {
        setStatus(`✅ Notification created! ID: ${(data[0] as any).id}`);
      } else {
        setStatus('✅ Notification created!');
      }
      setTimeout(() => refetch(), 500);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTriggers = async () => {
    if (!user) {
      setStatus('Error: Not logged in');
      return;
    }

    setStatus('Testing triggers... Check if triggers exist in database');
    
    // This will only work if triggers are set up correctly
    // You need to perform actual actions (comment, like, message) to test
  };

  const checkTableExists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('count')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setStatus('❌ Notifications table does NOT exist. Run migration!');
        } else {
          setStatus(`❌ Error: ${error.message}`);
        }
      } else {
        setStatus('✅ Notifications table exists!');
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification System Tester
        </CardTitle>
        <CardDescription className="text-xs">
          Debug tool - Remove from production
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-muted">
            <div className="font-medium">Unread Count</div>
            <div className="text-lg font-bold text-primary">{unreadCount}</div>
          </div>
          <div className="p-2 rounded bg-muted">
            <div className="font-medium">Total Notifications</div>
            <div className="text-lg font-bold">{notifications.length}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkTableExists} 
            disabled={loading}
            className="w-full text-xs h-8"
            variant="outline"
          >
            1. Check Table Exists
          </Button>
          
          <Button 
            onClick={testCreateNotification} 
            disabled={loading}
            className="w-full text-xs h-8"
          >
            2. Create Test Notification
          </Button>

          <Button 
            onClick={() => refetch()} 
            disabled={loading}
            className="w-full text-xs h-8"
            variant="outline"
          >
            3. Refresh Notifications
          </Button>

          <Button 
            onClick={() => markAllAsRead()} 
            disabled={loading || unreadCount === 0}
            className="w-full text-xs h-8"
            variant="secondary"
          >
            Mark All as Read
          </Button>
        </div>

        {status && (
          <div className={`p-2 rounded text-xs ${
            status.includes('✅') ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
            status.includes('❌') ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
            'bg-blue-500/10 text-blue-700 dark:text-blue-400'
          }`}>
            {status}
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs font-medium mb-2">Recent Notifications:</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-center gap-2 p-1.5 rounded bg-muted text-xs">
                {n.type === 'message' && <MessageCircle className="w-3 h-3" />}
                {n.type === 'like' && <Heart className="w-3 h-3" />}
                {n.type === 'comment' && <MessageSquare className="w-3 h-3" />}
                <span className="flex-1 truncate">{n.content}</span>
                {!n.is_read && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-muted-foreground text-xs text-center py-2">
                No notifications
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
