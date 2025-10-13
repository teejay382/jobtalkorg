
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, 
  Settings, 
  Star, 
  Video, 
  Bookmark, 
  LogOut, 
  User, 
  Building2, 
  Trash2, 
  Heart, 
  MessageCircle, 
  Play, 
  Camera, 
  FileText,
  Linkedin,
  Github,
  ExternalLink,
  Plus,
  Upload
} from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  const [savedJobs, setSavedJobs] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    company_name: '',
    skills: [] as string[],
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    resume_url: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  // Rename local loading state to avoid confusion with auth loading
  const [videosLoading, setVideosLoading] = useState(true);
  const { user, profile, signOut, loading: authLoading, updateProfile, refetchProfile } = useAuth();
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
    console.log('handleDeleteVideo called with:', { videoId, videoUrl });

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (dbError) {
        console.error('DB delete error:', dbError);
        throw dbError;
      }

      // Extract file path from video URL for storage deletion
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      console.log('Deleting from storage:', fileName);

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
      console.log('Video deleted successfully, updated state');

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

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.full_name,
      profile.bio,
      profile.avatar_url,
      profile.skills?.length > 0,
      profile.company_name || profile.username
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Initialize edit form when profile changes
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        company_name: profile.company_name || '',
        skills: profile.skills || [],
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        resume_url: ''
      });
    }
  }, [profile]);

  // Handle profile updates
  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setIsUploading(true);
      const { error } = await updateProfile({
        full_name: editForm.full_name,
        bio: editForm.bio,
        company_name: editForm.company_name,
        skills: editForm.skills
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const objectPath = `${user.id}/${fileName}`; // store inside user folder to satisfy RLS
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(objectPath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(objectPath);

      // cache-busting to ensure immediate visual update
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
      await updateProfile({ avatar_url: cacheBustedUrl });
      // ensure local state refresh if needed
      if (typeof refetchProfile === 'function') {
        await refetchProfile();
      }
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle skill addition
  const handleAddSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Handle skill removal
  const handleRemoveSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Header />
      
      <main className="pt-14 pb-14 px-4 max-w-4xl mx-auto animate-fade-in">
        {/* Profile Card - Main Section */}
        <div className="glass-card-premium rounded-2xl p-4 md:p-6 mb-4 border border-primary/15 shadow-glass relative overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 rounded-2xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
              {/* Profile Picture with Edit Overlay */}
              <div className="relative group">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-primary/25 shadow-[0_0_15px_hsl(var(--primary)/0.3)] ring-1 ring-primary/15 ring-offset-2 ring-offset-background">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.username || ''} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-lg font-semibold">
                      {(profile.full_name || profile.username || profile.email)
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Edit overlay */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                      <DialogDescription>
                        Upload a new profile picture from your device.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <h1 className="text-lg md:text-xl font-semibold text-foreground">
                        {profile.full_name || profile.username || 'User'}
                      </h1>
                      {getProfileRole(profile) === 'freelancer' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Building2 className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {getProfileRole(profile) === 'freelancer' ? 'Freelancer' : 'Employer'}
                      {profile.company_name && ` at ${profile.company_name}`}
                    </p>
                  </div>
                  
                  {/* Edit Button */}
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all duration-300 hover:scale-105">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information and social links.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself"
                            rows={3}
                          />
                        </div>
                        
                        {getProfileRole(profile) === 'employer' && (
                          <div className="space-y-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                              id="company_name"
                              value={editForm.company_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                              placeholder="Enter company name"
                            />
                          </div>
                        )}
                        
                        {/* Skills */}
                        <div className="space-y-2">
                          <Label>Skills</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editForm.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                {skill}
                                <button
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              placeholder="Add a skill"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            />
                            <Button onClick={handleAddSkill} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Social Links */}
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn URL</Label>
                          <Input
                            id="linkedin"
                            value={editForm.linkedin_url}
                            onChange={(e) => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            placeholder="https://linkedin.com/in/yourname"
                            type="url"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub URL</Label>
                          <Input
                            id="github"
                            value={editForm.github_url}
                            onChange={(e) => setEditForm(prev => ({ ...prev, github_url: e.target.value }))}
                            placeholder="https://github.com/yourname"
                            type="url"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="portfolio">Portfolio URL</Label>
                          <Input
                            id="portfolio"
                            value={editForm.portfolio_url}
                            onChange={(e) => setEditForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                            placeholder="https://yourportfolio.com"
                            type="url"
                          />
                        </div>
                        
                        {/* Resume Upload */}
                        <div className="space-y-2">
                          <Label>Resume (PDF)</Label>
                          <div className="flex items-center gap-2 p-3 border-2 border-dashed border-primary/30 rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Upload resume</span>
                            <Input type="file" accept=".pdf" className="hidden" />
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleProfileUpdate}
                            disabled={isUploading}
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-glow"
                          >
                            {isUploading ? 'Updating...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Rating and Stats */}
                <div className="flex items-center justify-center md:justify-start gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="font-medium text-foreground">4.8</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>
                  <div className="text-muted-foreground">
                    {userVideos.length} video{userVideos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <p className="text-muted-foreground mb-3 text-center md:text-left leading-relaxed text-sm">
                {profile.bio}
              </p>
            )}
            
            {/* Skills/Tags */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {profile.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs px-2 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        <div className="glass-card rounded-xl p-3 mb-4 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Profile Completion</span>
            <span className="text-xs text-muted-foreground">{calculateProfileCompletion()}%</span>
          </div>
          <Progress value={calculateProfileCompletion()} className="h-1.5" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
          <div className="glass-card-premium rounded-xl p-3 text-center border border-primary/15 hover:border-primary/30 transition-all duration-300 hover:shadow-glass group animate-fade-in">
            <Video className="w-4 h-4 md:w-5 md:h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-lg md:text-xl font-semibold text-foreground group-hover:scale-110 transition-transform">{userVideos.length}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Videos</div>
          </div>
          <div className="glass-card-premium rounded-xl p-3 text-center border border-accent/15 hover:border-accent/30 transition-all duration-300 hover:shadow-glass group animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-accent mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-lg md:text-xl font-semibold text-foreground group-hover:scale-110 transition-transform">0</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">
              {getProfileRole(profile) === 'freelancer' ? 'Projects' : 'Hires'}
            </div>
          </div>
          <div className="glass-card-premium rounded-xl p-3 text-center border border-primary/15 hover:border-primary/30 transition-all duration-300 hover:shadow-glass group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-lg md:text-xl font-semibold text-foreground group-hover:scale-110 transition-transform">0</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">
              {getProfileRole(profile) === 'freelancer' ? 'Saved Jobs' : 'Favorites'}
            </div>
          </div>
        </div>

        {/* Tab Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card-premium rounded-xl p-1 border border-primary/15">
            <TabsTrigger 
              value="videos" 
              className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-glow rounded-lg transition-all duration-300 text-xs md:text-sm py-2"
            >
              <Video className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">My Videos</span>
              <span className="sm:hidden">Videos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-glow rounded-lg transition-all duration-300 text-xs md:text-sm py-2"
            >
              <Bookmark className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Saved Jobs</span>
              <span className="sm:hidden">Saved</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-4">
            {videosLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary" style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.4)" }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 animate-pulse" style={{ filter: "blur(6px)" }} />
                </div>
              </div>
            ) : userVideos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {userVideos.map((video: any) => (
                  <div
                    key={video.id}
                    className="glass-card rounded-xl overflow-hidden shadow-soft relative group hover:shadow-glass transition-all duration-300 hover:scale-102"
                  >
                    <div className="aspect-[9/16] bg-gradient-to-br from-primary/15 to-accent/15 relative overflow-hidden">
                      {/* Video thumbnail */}
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-red-500">
                            <Trash2 className="w-3 h-3" />
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

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Video info */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <p className="text-white text-[10px] font-medium line-clamp-2 mb-1">
                          {video.title}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-white/80">
                          <span>{video.views_count || 0} views</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5" />
                              <span>{video.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <MessageCircle className="w-2.5 h-2.5" />
                              <span>{video.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-base font-medium text-foreground mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                  Start showcasing your {getProfileRole(profile) === 'freelancer' ? 'skills' : 'job opportunities'} with videos
                </p>
                <Button 
                  onClick={() => navigate('/upload')}
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-glow text-sm"
                  size="sm"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Create Your First Video
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            <div className="text-center py-8">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-base font-medium text-foreground mb-2">
                No saved {getProfileRole(profile) === 'freelancer' ? 'jobs' : 'profiles'} yet
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                Save {getProfileRole(profile) === 'freelancer' ? 'job opportunities' : 'freelancer profiles'} you're interested in
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/search')}
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-sm"
                size="sm"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Start Exploring
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Floating Edit Button */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-20 right-4 md:right-6 w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full shadow-glow hover:shadow-strong transition-all duration-300 hover:scale-110 flex items-center justify-center z-40">
            <Edit className="w-5 h-5 text-white" />
          </button>
        </DialogTrigger>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
};

export default Profile;
