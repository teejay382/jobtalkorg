import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, MessageCircle, Heart, MessageSquare, Check, X } from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileMenu from './MobileMenu';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const navigate = useNavigate();

  const handlePopoverOpen = (open: boolean) => {
    setIsPopoverOpen(open);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification) return;
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      let target: string | null = null;
      if (notification.link) {
        target = notification.link as string;
      } else {
        const type = notification.type as string | undefined;
        const refId = notification.reference_id as string | undefined;
        const senderId = notification.sender_id as string | undefined;

        switch (type) {
          case 'comment':
          case 'like':
            target = refId ? `/post/${encodeURIComponent(refId)}` : null;
            break;
          case 'message':
            target = senderId ? `/chat?user=${encodeURIComponent(senderId)}` : null;
            break;
          case 'hire':
          case 'job':
            target = refId ? `/job/${encodeURIComponent(refId)}` : null;
            break;
          case 'follow':
            target = senderId ? `/profile/${encodeURIComponent(senderId)}` : null;
            break;
          default:
            target = null;
        }
      }

      setIsPopoverOpen(false);
      navigate(target || '/');
    } catch (e) {
      setIsPopoverOpen(false);
      navigate('/');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'like':
        return <Heart className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-primary/15 shadow-glass z-40 py-2">
        <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="p-1 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/25 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
              <img src={logo} alt="JobTolk" className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
              JobTolk
            </h1>
          </div>

          <div className="flex items-center gap-1.5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpen}>
              <PopoverTrigger asChild>
                <button className="relative w-9 h-9 rounded-lg bg-background/40 backdrop-blur-sm hover:bg-muted/70 transition-all duration-300 flex items-center justify-center border border-primary/15 hover:border-primary/30 hover:shadow-soft active:scale-95 group">
                  <Bell className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-lg notification-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`group relative p-4 transition-colors cursor-pointer ${
                            notification.is_read 
                              ? 'hover:bg-muted/30' 
                              : 'bg-primary/5 hover:bg-primary/10'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`p-1.5 rounded-full ${
                                notification.is_read 
                                  ? 'bg-muted' 
                                  : 'bg-primary/20'
                              }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm line-clamp-2 ${
                                notification.is_read 
                                  ? 'text-muted-foreground' 
                                  : 'text-foreground font-medium'
                              }`}>
                                {notification.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                            title="Delete notification"
                          >
                            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-9 h-9 rounded-lg bg-background/40 backdrop-blur-sm hover:bg-muted/70 transition-all duration-300 flex items-center justify-center border border-primary/15 hover:border-primary/30 hover:shadow-soft active:scale-95 group"
            >
              <Menu className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
