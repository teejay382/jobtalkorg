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
import { MapPin, X, Plus, Briefcase, MapPinned } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { LOCAL_SERVICE_CATEGORIES } from '@/lib/localServiceCategories';

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'freelancer' | 'employer' | null>(null);
  const [serviceType, setServiceType] = useState<'remote' | 'local' | null>(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [autoDetectingLocation, setAutoDetectingLocation] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
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
            const { latitude: lat, longitude: lon } = position.coords;
            
            // Store coordinates
            setLatitude(lat);
            setLongitude(lon);
            
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
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

      // Prepare profile update data
      const profileData: any = {
        bio: bio || null,
        onboarding_completed: true,
      };

      // Add service type and related fields for freelancers
      if (role === 'freelancer') {
        profileData.service_type = serviceType;
        
        if (serviceType === 'local') {
          profileData.service_categories = serviceCategories.length > 0 ? serviceCategories : null;
          profileData.location_city = location || null;
          profileData.latitude = latitude;
          profileData.longitude = longitude;
        } else {
          profileData.skills = skills.length > 0 ? skills : null;
        }
      } else {
        // Employers get generic skills
        profileData.skills = skills.length > 0 ? skills : null;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

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

  // Check if can proceed based on role and service type
  const canProceed = () => {
    if (!bio.trim()) return false;
    
    if (role === 'freelancer') {
      if (!serviceType) return false;
      
      if (serviceType === 'local') {
        return serviceCategories.length > 0 && location.trim().length > 0 && latitude !== null && longitude !== null;
      } else {
        return skills.length > 0;
      }
    }
    
    return skills.length > 0;
  };
  
  const calculateProgress = () => {
    let progress = 0;
    if (bio.trim()) progress += 30;
    
    if (role === 'freelancer') {
      if (serviceType) progress += 20;
      
      if (serviceType === 'local') {
        if (serviceCategories.length > 0) progress += 25;
        if (location && latitude && longitude) progress += 25;
      } else if (serviceType === 'remote') {
        if (skills.length > 0) progress += 50;
      }
    } else if (skills.length > 0) {
      progress += 70;
    }
    
    return Math.round(progress);
  };
  
  const progress = calculateProgress();

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
              {!serviceType && role === 'freelancer' ? 'Choose Your Work Style 🚀' : 'Show Who You Are 💪'}
            </CardTitle>
            <CardDescription className="text-base">
              {!serviceType && role === 'freelancer'
                ? 'Do you work remotely or provide local services?'
                : role === 'freelancer' 
                  ? 'Let clients see what you can do'
                  : 'Tell us about your company and what you need'
              }
            </CardDescription>
          </div>
          
          {/* Portfolio Helper - Show after service type is selected */}
          {serviceType && role === 'freelancer' && (
            <div className="glass-card-premium rounded-2xl p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xl">💡</span>
                </div>
                 <div className="space-y-2 text-sm">
                   <p className="font-semibold text-foreground">Think of your first post as your portfolio, not a video.</p>
                   <p className="text-muted-foreground leading-relaxed">
                     Upload a short clip or photo that proves your skills — like your best haircut, your logo design, or a project you built.
                   </p>
                   <p className="text-primary text-xs font-medium">💪 Clients hire based on what they see, not what you say.</p>
                 </div>
              </div>
            </div>
          )}
          
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
          {/* Service Type Selection for Freelancers */}
          {role === 'freelancer' && !serviceType && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">What type of work do you do?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setServiceType('remote')}
                  className="group relative p-6 rounded-xl border-2 border-border hover:border-primary transition-all hover:shadow-lg bg-background"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Remote Freelancer</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Work from anywhere online
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setServiceType('local')}
                  className="group relative p-6 rounded-xl border-2 border-border hover:border-primary transition-all hover:shadow-lg bg-background"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MapPinned className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Local Service Provider</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Provide services in your area
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Show rest of form only after service type is selected (or if employer) */}
          {(serviceType || role === 'employer') && (
            <>
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

          {/* Location Section - Required for Local Service Providers */}
          {serviceType === 'local' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-base font-semibold">
                  Your location <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">Required for local services</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                We'll use this to connect you with nearby customers
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
                    required
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
              {latitude && longitude && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  GPS coordinates saved
                </p>
              )}
            </div>
          )}

          {/* Optional Location for Remote/Employers */}
          {serviceType === 'remote' && (
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">
              Your location (optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              We'll help you find jobs nearby
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
          )}

          {/* Service Categories for Local Providers */}
          {role === 'freelancer' && serviceType === 'local' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Select your service categories (up to 3)
              </Label>
              
              {/* Selected Categories */}
              {serviceCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((categoryId) => {
                    const category = LOCAL_SERVICE_CATEGORIES.find(c => c.id === categoryId);
                    if (!category) return null;
                    const Icon = category.icon;
                    return (
                      <Badge 
                        key={categoryId} 
                        variant="default"
                        className="px-3 py-2 text-sm rounded-xl flex items-center gap-2"
                      >
                        <Icon className="h-3 w-3" />
                        {category.label}
                        <button
                          onClick={() => setServiceCategories(serviceCategories.filter(c => c !== categoryId))}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Available Categories */}
              {serviceCategories.length < 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {LOCAL_SERVICE_CATEGORIES
                    .filter(category => !serviceCategories.includes(category.id))
                    .map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            if (serviceCategories.length < 3) {
                              setServiceCategories([...serviceCategories, category.id]);
                            }
                          }}
                          className="p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{category.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Skills Section for Remote Freelancers and Employers */}
          {(serviceType === 'remote' || role === 'employer') && (
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
          )}

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={!canProceed() || loading}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-medium"
          >
            {loading ? 'Completing Profile...' : role === 'freelancer' ? "Complete — Start Showcasing" : "Complete — Start Hiring"}
          </Button>
          </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            You can update this information anytime in your profile settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
