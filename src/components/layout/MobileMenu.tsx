
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Home, Search, Plus, MessageCircle, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => handleNavigation('/')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavigation('/search')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>

            <button
              onClick={() => handleNavigation('/upload')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Upload Video</span>
            </button>

            <button
              onClick={() => handleNavigation('/chat')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>

            <div className="border-t border-border my-4"></div>

            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
