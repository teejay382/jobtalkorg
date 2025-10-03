
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-border z-50 h-20 shadow-strong">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-2xl transition-smooth min-w-[60px] ${
                isActive && !item.isSpecial ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {item.isSpecial ? (
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-strong flex items-center justify-center hover:scale-105 transition-smooth">
                <item.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <item.icon className="w-6 h-6" strokeWidth={2} />
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
