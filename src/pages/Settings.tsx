import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', checked);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>

          <section className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </section>

          {/* Placeholder for future settings */}
          <section className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">More Settings Coming Soon</h2>
            <p className="text-muted-foreground">Additional settings will be added here in future updates.</p>
          </section>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Settings;
