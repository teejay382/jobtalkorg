
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, navigate]);

  // Show welcome screen for non-authenticated users
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-elegant flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logoImage} alt="Job Talk" className="h-20 w-20" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-primary">Welcome to Job Talk</CardTitle>
              <CardDescription className="text-lg mt-2">
                Connect freelancers and employers through authentic video showcases
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full" size="lg">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header - hidden on mobile for full-screen experience */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Main content - full screen on mobile */}
      <main className="md:pt-16 pb-16">
        <VideoFeed />
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Index;
