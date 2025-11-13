import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getPublicProfile } from '@/lib/profiles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        navigate('/not-found');
        return;
      }
      setLoading(true);
      try {
        // Try by username first
        let prof: any | null = null;
        const { data: byUsername } = await supabase
          .from('profiles')
          .select('id,user_id,username,full_name,bio,account_type,company_name,skills,avatar_url,service_type,service_categories,location_city,onboarding_completed,created_at,updated_at')
          .eq('username', id)
          .single();
        if (byUsername) {
          prof = byUsername;
        } else {
          // Fallback: treat param as user_id
          const { data } = await getPublicProfile(id);
          if (data) prof = data;
        }

        // If it's the logged-in user's profile, route to full profile with edit
        if (prof && user && prof.user_id === user.id) {
          navigate('/profile');
          return;
        }

        setProfile(prof);

        // Fetch public videos for the profile user
        if (prof && prof.user_id) {
          const { data: vids } = await supabase
            .from('videos')
            .select('id,title,thumbnail_url,video_url,created_at,likes_count,comments_count,views_count')
            .eq('user_id', prof.user_id)
            .order('created_at', { ascending: false })
            .limit(12);
          setVideos(vids || []);
        } else {
          setVideos([]);
        }
      } catch (e) {
        setProfile(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, user]);

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
      <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {profile.full_name || profile.username || 'User'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.company_name || profile.username}
                    {profile.location_city ? ` • ${profile.location_city}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Interaction buttons for public view */}
                  <Button onClick={() => profile.user_id && navigate(`/chat?user=${encodeURIComponent(profile.user_id)}`)} size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    Message
                  </Button>
                  <Button variant="outline" size="sm">Follow</Button>
                  <Button variant="outline" size="sm">Hire</Button>
                </div>
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{profile.bio}</p>
              )}
              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {profile.skills.slice(0, 10).map((s: string, i: number) => (
                    <span key={i} className="skill-tag text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className="mt-4">
          <h2 className="text-base font-semibold mb-2">Recent Work</h2>
          {videos.length === 0 ? (
            <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground border border-primary/10">No videos yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videos.map((v) => (
                <div key={v.id} className="glass-card rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="aspect-[9/16] bg-gradient-to-br from-primary/15 to-accent/15 relative">
                    {v.thumbnail_url && (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-1 left-1 right-1 text-[11px] text-white/90 line-clamp-2">
                      <div className="bg-black/40 rounded px-1 py-0.5 inline-block max-w-full truncate">{v.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default PublicProfile;
