import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, HelpCircle, LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundEnabled, setSoundEnabled, permissionGranted } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(permissionGranted);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // Request permission
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          toast({
            title: '🔔 Notifications enabled',
            description: 'You will now receive desktop notifications',
          });
        } else {
          toast({
            title: 'Permission denied',
            description: 'Please enable notifications in your browser settings',
            variant: 'destructive',
          });
        }
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: 'Notifications disabled',
        description: 'You can re-enable them anytime',
      });
    }
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    toast({
      title: newValue ? '🔊 Sounds enabled' : '🔇 Sounds disabled',
      description: newValue ? 'You will hear notification sounds' : 'Notification sounds are muted',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-primary/15 shadow-glass z-40 py-2">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg bg-background/40 backdrop-blur-sm hover:bg-muted/70 transition-all duration-300 flex items-center justify-center border border-primary/15 hover:border-primary/30 hover:shadow-soft active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Settings
          </h1>
        </div>
      </div>

      <main className="pt-20 pb-20 px-4 max-w-md mx-auto animate-fade-in">
        <div className="space-y-4">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h2>
            
            <div className="glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notifications</h2>
            
            <div className="glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Desktop Notifications</h3>
                    <p className="text-sm text-muted-foreground">Get notified about activity</p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </div>

            <div className="glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Notification Sounds</h3>
                    <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>
            
            <button
              onClick={() => navigate('/profile-settings')}
              className="w-full glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Edit Profile</h3>
                    <p className="text-sm text-muted-foreground">Manage your account</p>
                  </div>
                </div>
              </div>
            </button>

            <button
              className="w-full glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Privacy & Security</h3>
                    <p className="text-sm text-muted-foreground">Manage your data</p>
                  </div>
                </div>
              </div>
            </button>

            <button
              className="w-full glass-card-premium p-4 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Help & Support</h3>
                    <p className="text-sm text-muted-foreground">Get help and feedback</p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="destructive"
              className="w-full h-12 rounded-xl font-semibold hover:shadow-soft transition-all duration-300 hover:scale-[1.02] active:scale-100"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {loading ? 'Logging out...' : 'Log Out'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
