import { useState } from 'react';
import { MessageCircle, User, Play, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FreelancerProfile } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';

interface FreelancerCardProps {
  freelancer: FreelancerProfile;
}

export const FreelancerCard = ({ freelancer }: FreelancerCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleMessage = () => {
    navigate(`/chat?user=${freelancer.user_id}`);
  };

  const handleViewProfile = () => {
    const id = freelancer.username || freelancer.user_id;
    if (!id) return;
    navigate(`/profile/${encodeURIComponent(id)}`);
  };

  const displayName = freelancer.full_name || freelancer.username || 'Freelancer';
  const hasVideos = freelancer.videos && freelancer.videos.length > 0;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-medium transition-all duration-300 hover:translate-y-[-2px]">
      {/* Header with profile info */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-16 h-16">
          <AvatarImage 
            src={freelancer.avatar_url} 
            onError={() => setImageError(true)}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground truncate">
            {displayName}
          </h3>
          {freelancer.bio && (
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {freelancer.bio}
            </p>
          )}
          
          {/* Rating placeholder - can be added later */}
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground ml-1">4.8</span>
          </div>
        </div>
      </div>

      {/* Skills */}
      {freelancer.skills && freelancer.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {freelancer.skills.slice(0, 4).map((skill, index) => (
            <span 
              key={index}
              className="skill-tag text-xs"
            >
              {skill}
            </span>
          ))}
          {freelancer.skills.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{freelancer.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Video previews */}
      {hasVideos && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">Recent Work</p>
          <div className="flex gap-2 overflow-x-auto">
            {freelancer.videos!.slice(0, 3).map((video) => (
              <div 
                key={video.id}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-secondary cursor-pointer group"
                onClick={handleViewProfile}
              >
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Play className="w-4 h-4 text-white opacity-80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewProfile}
          className="flex-1"
        >
          View Profile
        </Button>
        <Button 
          size="sm"
          onClick={handleMessage}
          className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </Button>
      </div>
    </div>
  );
};