import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Video, MapPin, X, Plus, Lightbulb } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'freelancer' | 'employer' | null>(null);
  const [bio, setBio] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [autoDetectingLocation, setAutoDetectingLocation] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const suggestedSkills = [
    'Web Design', 'Photography', 'Writing', 'Video Editing', 'Social Media',
    'Graphic Design', 'Translation', 'Voice Over', 'Data Entry', 'Customer Service',
    'Accounting', 'Marketing', 'SEO', 'Mobile Development', 'Teaching'
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Get user's role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/');
        return;
      }

      if (profile?.role) {
        setRole(profile.role as 'freelancer' | 'employer');
      }
    };

    checkAuth();
  }, [navigate]);

  const autoDetectLocation = async () => {
    setAutoDetectingLocation(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            setLocation(`${city}, ${country}`.trim());
            
            toast({
              title: "Location detected!",
              description: `We found you in ${city}, ${country}`,
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: "Couldn't detect location",
              description: "Please enter your location manually",
              variant: "destructive"
            });
          }
        );
      }
    } catch (error) {
      console.error('Location detection error:', error);
    } finally {
      setAutoDetectingLocation(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "Video too large",
          description: "Please upload a video under 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
    }
  };

  const addSkill = (skill: string) => {
    if (skills.length >= 3) {
      toast({
        title: "Maximum skills reached",
        description: "You can select up to 3 skills",
        variant: "destructive"
      });
      return;
    }
    
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      addSkill(customSkill.trim());
      setCustomSkill('');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let videoUrl = null;
      
      // Upload video if provided
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${session.user.id}-intro-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        videoUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: bio || null,
          skills: skills.length > 0 ? skills : null,
          onboarding_completed: true,
        })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      // If video was uploaded, create a video record
      if (videoUrl) {
        await supabase.from('videos').insert({
          user_id: session.user.id,
          title: 'My Introduction',
          description: bio || 'Introduction video',
          video_url: videoUrl,
          tags: skills
        });
      }

      toast({
        title: "Profile completed! 🎉",
        description: "You're all set to start using JobTolk",
      });

      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: "Failed to complete profile setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = bio.trim().length > 0 && skills.length > 0;
  const progress = canProceed ? 100 : Math.round((
    (bio.trim() ? 50 : 0) + 
    (skills.length > 0 ? 50 : 0)
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-glass-strong border border-primary/20 rounded-3xl backdrop-blur-xl bg-background/95 animate-scale-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
              <img src={logoImage} alt="JobTolk" className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Show who you are 💪
            </CardTitle>
            <CardDescription className="text-base">
              {role === 'freelancer' 
                ? 'Let people see what you can do'
                : 'Tell us about your company and what you need'
              }
            </CardDescription>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-muted/50 rounded-full h-2 border border-primary/20 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-primary via-accent to-primary h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_hsl(var(--primary)/0.5)] relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{progress}% complete</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-base font-semibold">
              Tell us what you do in one line
            </Label>
            <Textarea
              id="bio"
              placeholder={role === 'freelancer' 
                ? "e.g., I design websites that people love to use" 
                : "e.g., Looking for skilled graphic designers for our startup"
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[80px] rounded-xl resize-none"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/150 characters
            </p>
          </div>

          {/* Video Upload Section */}
          {role === 'freelancer' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Upload a short intro video 🎥
                </Label>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Lightbulb className="h-3 w-3" />
                  <span className="font-medium">Profiles with video get 3x more jobs</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Record or upload a 30-second video — say your name and what you do
              </p>
              
              {videoPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-border">
                  <video 
                    src={videoPreview} 
                    controls 
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Video className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, MOV up to 50MB</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="video/*"
                    onChange={handleVideoUpload}
                  />
                </label>
              )}
            </div>
          )}

          {/* Location Section */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">
              Your location
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              We'll help you find {role === 'freelancer' ? 'jobs' : 'talent'} nearby
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Lagos, Nigeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={autoDetectLocation}
                disabled={autoDetectingLocation}
                className="shrink-0"
              >
                {autoDetectingLocation ? 'Detecting...' : 'Auto-detect'}
              </Button>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Choose 3 skills you're best at
            </Label>
            
            {/* Selected Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="default"
                    className="px-3 py-2 text-sm rounded-xl flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Skills */}
            {skills.length < 3 && (
              <>
                <p className="text-sm text-muted-foreground">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills
                    .filter(skill => !skills.includes(skill))
                    .slice(0, 9)
                    .map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary rounded-xl"
                        onClick={() => addSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                </div>
              </>
            )}

            {/* Custom Skill Input */}
            {skills.length < 3 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                  className="rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={!canProceed || loading}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-medium"
          >
            {loading ? 'Setting up...' : "Done — Let's find work"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can update this information anytime in your profile settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
