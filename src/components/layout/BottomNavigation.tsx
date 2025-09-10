
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
    <nav className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-t border-white/10 z-50 h-16">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${
                item.isSpecial ? 'fab-mini' : ''
              }`
            }
          >
            {item.isSpecial ? (
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-light rounded-full shadow-glow flex items-center justify-center">
                <item.icon className="w-6 h-6 text-white" />
              </div>
            ) : (
              <>
                <item.icon className="w-6 h-6 text-white/80" />
                <span className="text-xs font-medium text-white/80">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
