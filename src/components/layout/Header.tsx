import { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-2xl border-b border-primary/20 shadow-glass z-40">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
              <img src={logo} alt="JobTolk" className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
              JobTolk
            </h1>
          </div>

          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <button className="w-11 h-11 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all duration-300 flex items-center justify-center border border-primary/20 hover:border-primary/40 hover:shadow-soft active:scale-95 group">
              <Bell className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-11 h-11 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all duration-300 flex items-center justify-center border border-primary/20 hover:border-primary/40 hover:shadow-soft active:scale-95 group"
            >
              <Menu className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
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
