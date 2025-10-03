import { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import logo from '@/assets/logo.png';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-border shadow-medium z-40">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
              <img src={logo} alt="JobTolk" className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              JobTolk
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center hover:bg-muted transition-smooth">
              <Bell className="w-5 h-5 text-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center hover:bg-muted transition-smooth"
            >
              <Menu className="w-5 h-5 text-foreground" strokeWidth={2} />
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
