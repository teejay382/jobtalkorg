import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        if (session) {
          // Check if profile exists and onboarding is completed
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .single();

          if (profile && !profile.onboarding_completed) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // No session found, redirect to auth
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
