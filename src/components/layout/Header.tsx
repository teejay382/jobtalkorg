import { useState } from 'react';
import { Bell, Menu, MessageCircle, Heart, MessageSquare } from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileMenu from './MobileMenu';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      markAsRead();
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
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
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
