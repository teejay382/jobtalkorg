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

  console.log('Index page state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    onboardingCompleted: profile?.onboarding_completed,
    loading 
  });

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
