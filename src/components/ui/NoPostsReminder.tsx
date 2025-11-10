import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const NoPostsReminder = () => {
  const [show, setShow] = useState(false);
  const [hasVideos, setHasVideos] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkForVideos = async () => {
      if (!user || !profile || profile.role !== 'freelancer') {
        setLoading(false);
        return;
      }

      // Check if user has already dismissed this reminder
      const dismissed = localStorage.getItem('noPostsReminderDismissed');
      if (dismissed === 'true') {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('videos')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;

        const hasNoVideos = !data || data.length === 0;
        setHasVideos(!hasNoVideos);
        
        // Only show if user has no videos
        if (hasNoVideos) {
          // Delay showing by 3 seconds for better UX
          setTimeout(() => setShow(true), 3000);
        }
      } catch (error) {
        console.error('Error checking for videos:', error);
      } finally {
        setLoading(false);
      }
    };

    checkForVideos();
  }, [user, profile]);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('noPostsReminderDismissed', 'true');
  };

  const handleUpload = () => {
    setShow(false);
    navigate('/upload');
  };

  if (loading || !show || hasVideos) {
    return null;
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 animate-slide-down">
      <div className="max-w-2xl mx-auto glass-card-premium rounded-2xl p-6 border-2 border-primary/30 shadow-glass-strong bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-extrabold text-xl md:text-2xl text-foreground mb-2 leading-tight">
                Clients Can't Find You Yet 👀
              </h3>
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-medium">
                Your profile is invisible in search until you upload your first work. 
                Showcase your skills to start getting hired!
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleUpload}
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:scale-105 transition-all"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your Work
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Remind me later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
