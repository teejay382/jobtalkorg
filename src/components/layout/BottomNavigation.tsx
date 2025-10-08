
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl border-t border-primary/20 z-50 h-20 shadow-glass">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto h-full">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 min-w-[60px] animate-fade-in ${
                isActive && !item.isSpecial 
                  ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-soft' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:scale-95'
              }`
            }
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {item.isSpecial ? (
              <div className="w-14 h-14 bg-gradient-to-br from-primary via-accent to-primary rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.5)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all duration-300 active:scale-100 border border-primary/30">
                <item.icon className="w-7 h-7 text-primary-foreground drop-shadow-lg" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <item.icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                <span className="text-xs font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
