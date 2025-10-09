
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl border-t border-primary/20 z-50 h-16 shadow-glass">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto h-full">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all duration-300 min-w-[52px] animate-fade-in ${
                isActive && !item.isSpecial 
                  ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-soft scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 hover:scale-105 active:scale-95'
              }`
            }
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {item.isSpecial ? (
              <div className="w-11 h-11 bg-gradient-to-br from-primary via-accent to-primary rounded-xl shadow-[0_0_15px_hsl(var(--primary)/0.5)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_25px_hsl(var(--primary)/0.7)] transition-all duration-300 active:scale-100 border border-primary/30">
                <item.icon className="w-5 h-5 text-primary-foreground drop-shadow-lg" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
