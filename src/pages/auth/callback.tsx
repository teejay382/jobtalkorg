import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Callback: Starting authentication process...');
        
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Callback: Session retrieved', { 
          hasSession: !!session, 
          sessionError: sessionError?.message 
        });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        if (session) {
          console.log('Callback: Session found, checking profile...');
          
          // Check if profile exists and onboarding is completed
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .single();

          console.log('Callback: Profile check result', { 
            profile, 
            profileError: profileError?.message 
          });

          if (profileError) {
            console.error('Profile query error:', profileError);
            // If profile doesn't exist yet, redirect to onboarding
            console.log('Callback: Navigating to onboarding (no profile)');
            navigate('/onboarding', { replace: true });
            return;
          }

          if (profile && !profile.onboarding_completed) {
            console.log('Callback: Navigating to onboarding');
            navigate('/onboarding', { replace: true });
          } else {
            console.log('Callback: Navigating to home');
            navigate('/', { replace: true });
          }
        } else {
          // No session found, redirect to auth
          console.log('Callback: No session, redirecting to auth');
          setError('No session found. Redirecting to login...');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An error occurred. Redirecting...');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-foreground">Processing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
