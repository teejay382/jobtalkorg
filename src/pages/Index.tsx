import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import VideoFeed from '@/components/feed/VideoFeed';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logoImage from '@/assets/logo.png';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  // Memoize computed values to prevent re-renders
  const needsOnboarding = useMemo(() => 
    user && profile && !profile.onboarding_completed,
    [user, profile]
  );
  
  const isAuthenticated = useMemo(() => !loading && user, [loading, user]);

  // Combine useEffect hooks to reduce re-renders
  useEffect(() => {
    // Handle authentication and onboarding redirects
    if (loading) return;

    if (!user) {
      navigate('/welcome', { replace: true });
      return;
    }

    if (needsOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // Check if this is user's first time after onboarding
    const hasSeenWelcome = localStorage.getItem('hasSeenDashboardWelcome');
    if (!hasSeenWelcome && profile?.onboarding_completed) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenDashboardWelcome', 'true');
    }
  }, [loading, user, profile, needsOnboarding, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* First-time Welcome Banner */}
      {showWelcome && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome, {profile?.full_name || profile?.username}! 🚀
                </h2>
                <p className="text-muted-foreground">
                  You're all set. {profile?.role === 'freelancer' 
                    ? 'Post your first skill or start browsing jobs near you.' 
                    : 'Start finding talented people for your projects.'}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {profile?.role === 'freelancer' ? (
                    <>
                      <Button 
                        onClick={() => navigate('/search')}
                        size="sm"
                        className="rounded-xl"
                      >
                        Find Jobs Nearby
                      </Button>
                      <Button 
                        onClick={() => navigate('/upload')}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        Post My Skill
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={() => navigate('/search')}
                        size="sm"
                        className="rounded-xl"
                      >
                        Find Talent
                      </Button>
                      <Button 
                        onClick={() => navigate('/upload')}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        Post a Job
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - hidden on mobile for full-screen experience */}
      <div className="hidden md:block absolute top-0 left-0 right-0 z-40">
        <Header />
      </div>

      {/* Main content - full screen feed */}
      <main className="w-full h-full">
        <VideoFeed />
      </main>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Index;
