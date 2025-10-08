
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Settings, Star, Video, Bookmark, LogOut, User, Building2, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth, getProfileRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [userVideos, setUserVideos] = useState([]);
  // Rename local loading state to avoid confusion with auth loading
  const [videosLoading, setVideosLoading] = useState(true);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleDeleteVideo = async (videoId: string, videoUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      // Extract file path from video URL for storage deletion
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([fileName]);

      if (storageError) {
        console.warn('Error deleting from storage:', storageError);
        // Don't throw here as the DB deletion was successful
      }

      // Update local state
      setUserVideos(prev => prev.filter((video: any) => video.id !== videoId));
      
      toast({
        title: "Video deleted",
        description: "Your video has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show a loader until auth is resolved and profile is available
  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary" style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" style={{ filter: "blur(12px)" }} />
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto animate-fade-in">
        {/* Profile header */}
        <div className="profile-header mb-6 glass-card-premium p-5 rounded-2xl border border-primary/20 shadow-glass">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)] ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
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
                {getProfileRole(profile) === 'freelancer' ? (
                  <User className="w-5 h-5 text-blue-400" />
                ) : (
                  <Building2 className="w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-white/90">
                {getProfileRole(profile) === 'freelancer' ? 'Freelancer' : 'Employer'}
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
          <div className="glass-card-premium rounded-xl p-4 text-center border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glass group animate-fade-in">
            <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">{userVideos.length}</div>
            <div className="text-sm text-muted-foreground">Videos</div>
          </div>
          <div className="glass-card-premium rounded-xl p-4 text-center border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-glass group animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="text-2xl font-bold text-accent group-hover:scale-110 transition-transform">0</div>
            <div className="text-sm text-muted-foreground">
              {getProfileRole(profile) === 'freelancer' ? 'Projects' : 'Hires'}
            </div>
          </div>
          <div className="glass-card-premium rounded-xl p-4 text-center border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glass group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform">0</div>
            <div className="text-sm text-muted-foreground">
              {getProfileRole(profile) === 'freelancer' ? 'Saved Jobs' : 'Favorites'}
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
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary/30 border-t-primary" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.5)" }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" style={{ filter: "blur(8px)" }} />
                </div>
              </div>
            ) : userVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {userVideos.map((video: any) => (
                  <div
                    key={video.id}
                    className="bg-card rounded-xl overflow-hidden shadow-soft relative group"
                  >
                    <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Video</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this video? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id, video.video_url)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

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
                  Start showcasing your {getProfileRole(profile) === 'freelancer' ? 'skills' : 'job opportunities'} with videos
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
                No saved {getProfileRole(profile) === 'freelancer' ? 'jobs' : 'profiles'} yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Save {getProfileRole(profile) === 'freelancer' ? 'job opportunities' : 'freelancer profiles'} you're interested in
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
