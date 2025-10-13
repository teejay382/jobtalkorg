import { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileMenu from './MobileMenu';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

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
            <button className="relative w-9 h-9 rounded-lg bg-background/40 backdrop-blur-sm hover:bg-muted/70 transition-all duration-300 flex items-center justify-center border border-primary/15 hover:border-primary/30 hover:shadow-soft active:scale-95 group">
              <Bell className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-lg notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
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
