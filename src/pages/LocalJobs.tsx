import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Filter,
  MessageCircle,
  Briefcase,
  Loader2
} from 'lucide-react';
import { 
  LOCAL_SERVICE_CATEGORIES, 
  getServiceCategoryById,
  formatDistance 
} from '@/lib/localServiceCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocalProvider {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  service_categories: string[] | null;
  location_city: string | null;
  latitude: number;
  longitude: number;
  distance: number;
}

const LocalJobs = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [providers, setProviders] = useState<LocalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState(50); // km
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Get user's location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch providers when location or filters change
  useEffect(() => {
    if (userLocation) {
      fetchNearbyProviders();
    }
  }, [userLocation, maxDistance, selectedCategory]);

  const getUserLocation = async () => {
    // First try to use saved location from profile
    if (profile?.latitude && profile?.longitude) {
      setUserLocation({ lat: profile.latitude, lon: profile.longitude });
      return;
    }

    // Otherwise, request browser location
    setDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setDetectingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: 'Location access needed',
            description: 'Please enable location to find nearby service providers',
            variant: 'destructive'
          });
          setDetectingLocation(false);
          setLoading(false);
        }
      );
    } else {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services',
        variant: 'destructive'
      });
      setDetectingLocation(false);
      setLoading(false);
    }
  };

  const fetchNearbyProviders = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_nearby_providers', {
        user_lat: userLocation.lat,
        user_lon: userLocation.lon,
        max_distance: maxDistance,
        service_category: selectedCategory === 'all' ? null : selectedCategory
      });

      if (error) throw error;

      setProviders((data as LocalProvider[]) || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load nearby service providers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactProvider = async (providerId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact service providers'
      });
      navigate('/auth');
      return;
    }

    // Create or get conversation
    try {
      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .or(`participant_1.eq.${providerId},participant_2.eq.${providerId}`)
        .single();

      if (existingConvo) {
        navigate(`/chat?conversation=${existingConvo.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: providerId
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat?conversation=${newConvo.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  };

  const handleHireProvider = async (providerId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Create or get conversation with provider
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${providerId})`)
        .or(`and(participant_1.eq.${providerId},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (!existingConvo) {
        await supabase.from('conversations').insert({
          participant_1: user.id,
          participant_2: providerId
        });
      }

      toast({
        title: 'Contact initiated',
        description: 'You can now message this provider in the Chat tab.'
      });
      
      // Navigate to chat
      navigate('/chat');
    } catch (error) {
      console.error('Error creating hire:', error);
      toast({
        title: 'Error',
        description: 'Failed to send hire request',
        variant: 'destructive'
      });
    }
  };

  // Filter providers by search query
  const filteredProviders = providers.filter(provider => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const name = (provider.full_name || provider.username || '').toLowerCase();
    const bio = (provider.bio || '').toLowerCase();
    const location = (provider.location_city || '').toLowerCase();
    
    return name.includes(query) || bio.includes(query) || location.includes(query);
  });

  if (detectingLocation || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {detectingLocation ? 'Detecting your location...' : 'Finding nearby service providers...'}
          </p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Location Required</h2>
            <p className="text-muted-foreground text-center mt-2">
              We need your location to show nearby service providers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={getUserLocation} className="w-full">
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Local Services</h1>
              <p className="text-sm text-muted-foreground">Find service providers near you</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={detectingLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Refresh Location
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, service, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {LOCAL_SERVICE_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={maxDistance.toString()} onValueChange={(val) => setMaxDistance(Number(val))}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Within 10km</SelectItem>
                <SelectItem value="25">Within 25km</SelectItem>
                <SelectItem value="50">Within 50km</SelectItem>
                <SelectItem value="100">Within 100km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No providers found</h3>
            <p className="text-muted-foreground mb-4">
              Try expanding your search radius or changing filters
            </p>
            <Button onClick={() => {
              setMaxDistance(100);
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {filteredProviders.length} service provider{filteredProviders.length !== 1 ? 's' : ''} nearby
            </p>
            
            {filteredProviders.map((provider) => (
              <Card key={provider.user_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar 
                      className="w-16 h-16 cursor-pointer" 
                      onClick={() => navigate(`/profile/${provider.user_id}`)}
                    >
                      <AvatarImage src={provider.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-white text-lg font-bold">
                        {(provider.full_name || provider.username || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/profile/${provider.user_id}`)}
                          >
                            {provider.full_name || provider.username || 'Anonymous'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{provider.location_city}</span>
                            <span>•</span>
                            <span className="font-medium text-primary">
                              {formatDistance(provider.distance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {provider.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {provider.bio}
                        </p>
                      )}

                      {/* Service Categories */}
                      {provider.service_categories && provider.service_categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {provider.service_categories.map((categoryId) => {
                            const category = getServiceCategoryById(categoryId);
                            if (!category) return null;
                            const Icon = category.icon;
                            return (
                              <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {category.label}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleContactProvider(provider.user_id)}
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleHireProvider(provider.user_id)}
                          className="flex-1"
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          Hire
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalJobs;
