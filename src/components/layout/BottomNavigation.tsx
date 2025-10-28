
import { Home, Search, User, MessageCircle, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const BottomNavigation = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/upload', icon: Plus, label: 'Upload', isSpecial: true },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/85 backdrop-blur-xl border-t border-primary/15 z-50 h-14 shadow-glass">
      <div className="flex items-center justify-around px-3 py-1 max-w-md mx-auto h-full">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all duration-300 min-w-[48px] animate-fade-in ${
                isActive && !item.isSpecial 
                  ? 'bg-gradient-to-br from-primary/15 to-accent/15 text-primary border border-primary/25 shadow-soft scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 hover:scale-105 active:scale-95'
              }`
            }
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {item.isSpecial ? (
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-accent to-primary rounded-lg shadow-[0_0_12px_hsl(var(--primary)/0.4)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all duration-300 active:scale-100 border border-primary/25">
                <item.icon className="w-4 h-4 text-primary-foreground drop-shadow-lg" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
