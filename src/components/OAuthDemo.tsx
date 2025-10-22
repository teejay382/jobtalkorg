import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const OAuthDemo = () => {
  const { user, session, loading, signOut } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        setAuthLoading(false);
      }
      // Note: Don't set authLoading to false here as the page will redirect
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Supabase OAuth Demo
          </CardTitle>
          <CardDescription>
            Seamless Google OAuth with automatic token handling
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {user ? (
            // User is logged in
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Welcome back!</h3>
                <p className="text-gray-600">{user.email}</p>
                {session && (
                  <p className="text-sm text-gray-500 mt-1">
                    Session expires: {new Date(session.expires_at! * 1000).toLocaleString()}
                  </p>
                )}
              </div>

              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          ) : (
            // User is not logged in
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Sign in to continue</h3>
                <p className="text-gray-600">Use your Google account to access the application</p>
              </div>

              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? 'Signing in...' : 'Continue with Google'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthDemo;
