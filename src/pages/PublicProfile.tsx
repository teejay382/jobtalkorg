import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicProfile } from '@/lib/profiles';
import { supabase } from '@/integrations/supabase/client';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        navigate('/not-found');
        return;
      }
      setLoading(true);
      try {
        // Try by user_id first
        let prof: any | null = null;
        const { data, error } = await getPublicProfile(id);
        if (!error && data) {
          prof = data;
        } else {
          // Try by username
          const { data: byUsername, error: err2 } = await supabase
            .from('profiles')
            .select('id,user_id,username,full_name,bio,account_type,company_name,skills,avatar_url,onboarding_completed,created_at,updated_at')
            .eq('username', id)
            .single();
          if (!err2 && byUsername) {
            prof = byUsername;
          }
        }
        setProfile(prof);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary" style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.5)' }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" style={{ filter: 'blur(12px)' }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20 px-4 max-w-2xl mx-auto">
          <div className="text-center text-muted-foreground">Profile not found.</div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Header />
      <main className="pt-20 pb-20 px-4 max-w-2xl mx-auto animate-fade-in">
        <div className="glass-card-premium rounded-2xl p-6 border border-primary/15 shadow-glass">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                  {(profile.full_name || profile.username || 'U')
                    .toString()
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground">
                {profile.full_name || profile.username || 'User'}
              </h1>
              {profile.company_name && (
                <div className="text-sm text-muted-foreground">{profile.company_name}</div>
              )}
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{profile.bio}</p>
              )}
              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {profile.skills.slice(0, 8).map((s: string, i: number) => (
                    <span key={i} className="skill-tag text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default PublicProfile;
