
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Settings, Star, Video, Bookmark, LogOut, User, Building2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [userVideos, setUserVideos] = useState([]);
  // Rename local loading state to avoid confusion with auth loading
  const [videosLoading, setVideosLoading] = useState(true);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before deciding redirects
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    fetchUserVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading, navigate]);

  const fetchUserVideos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show a loader until auth is resolved and profile is available
  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const mockVideos = [
    { id: '1', title: 'React Performance Tips', views: 1200, likes: 89 },
    { id: '2', title: 'My Development Setup', views: 850, likes: 67 },
    { id: '3', title: 'Building APIs with Node.js', views: 2100, likes: 156 },
  ];

  const savedJobs = [
    { id: '1', company: 'TechStart', role: 'Senior React Developer', salary: '$90k-120k' },
    { id: '2', company: 'WebCorp', role: 'Full-Stack Engineer', salary: '$80k-110k' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        {/* Profile header */}
        <div className="profile-header mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-white/20">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.username || ''} />
              ) : (
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {(profile.full_name || profile.username || profile.email)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">
                  {profile.full_name || profile.username || 'User'}
                </h1>
                {profile.account_type === 'freelancer' ? (
                  <User className="w-5 h-5 text-blue-400" />
                ) : (
                  <Building2 className="w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-white/90">
                {profile.account_type === 'freelancer' ? 'Freelancer' : 'Employer'}
                {profile.company_name && ` at ${profile.company_name}`}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white/90 text-sm">4.8</span>
                </div>
                <div className="text-white/90 text-sm">
                  {userVideos.length} video{userVideos.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {profile.bio && (
            <p className="text-white/90 text-sm mb-4">{profile.bio}</p>
          )}
          
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-primary">{userVideos.length}</div>
            <div className="text-sm text-muted-foreground">Videos</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-success">0</div>
            <div className="text-sm text-muted-foreground">
              {profile.account_type === 'freelancer' ? 'Projects' : 'Hires'}
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-accent">0</div>
            <div className="text-sm text-muted-foreground">
              {profile.account_type === 'freelancer' ? 'Saved Jobs' : 'Favorites'}
            </div>
          </div>
        </div>

        {/* Content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-xl">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              My Videos
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved Jobs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : userVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {userVideos.map((video: any) => (
                  <div
                    key={video.id}
                    className="bg-card rounded-xl overflow-hidden shadow-soft"
                  >
                    <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {video.title}
                        </p>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{video.views_count || 0} views</span>
                        <span>{video.likes_count || 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start showcasing your {profile.account_type === 'freelancer' ? 'skills' : 'job opportunities'} with videos
                </p>
                <Button onClick={() => navigate('/upload')}>
                  Create Your First Video
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="mt-6">
            <div className="text-center py-12">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No saved {profile.account_type === 'freelancer' ? 'jobs' : 'profiles'} yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Save {profile.account_type === 'freelancer' ? 'job opportunities' : 'freelancer profiles'} you're interested in
              </p>
              <Button variant="outline" onClick={() => navigate('/search')}>
                Start Exploring
              </Button>
            </div>
          </TabsContent>

          {/* Settings section */}
          <div className="mt-8 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full justify-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Profile;
