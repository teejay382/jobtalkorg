import { useState, useEffect } from 'react';
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

  console.log('Index page state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    onboardingCompleted: profile?.onboarding_completed,
    loading 
  });

  useEffect(() => {
    // Check if this is user's first time after onboarding
    const hasSeenWelcome = localStorage.getItem('hasSeenDashboardWelcome');
    if (!hasSeenWelcome && profile?.onboarding_completed) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenDashboardWelcome', 'true');
    }
  }, [profile]);

  useEffect(() => {
    if (user && profile && !profile.onboarding_completed) {
      console.log('Redirecting to onboarding from Index');
      navigate('/onboarding');
    }
  }, [user, profile, navigate]);

  // Redirect non-authenticated users to welcome page
  useEffect(() => {
    if (!loading && !user) {
      console.log('Redirecting to welcome - no user');
      navigate('/welcome');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* First-time Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border backdrop-blur-sm">
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
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Main content - full screen on mobile */}
      <main className="md:pt-16 pb-16 bg-background">
        <VideoFeed />
      </main>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Index;
