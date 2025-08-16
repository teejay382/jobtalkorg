import { Heart, MessageCircle, Share, Briefcase, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    user: {
      name: string;
      avatar?: string;
      role: string;
    };
    description: string;
    skills: string[];
    likes: number;
    comments: number;
    isEmployer?: boolean;
  };
}

const VideoCard = ({ video }: VideoCardProps) => {
  return (
    <div className="video-card">
      {/* Video placeholder with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/30" />
      <div className="video-overlay" />
      
      {/* Video interactions */}
      <div className="video-interactions">
        <button className="interaction-btn">
          <Heart className="w-5 h-5" />
        </button>
        <span className="text-white text-xs font-medium">{video.likes}</span>
        
        <button className="interaction-btn">
          <MessageCircle className="w-5 h-5" />
        </button>
        <span className="text-white text-xs font-medium">{video.comments}</span>
        
        <button className="interaction-btn">
          <Share className="w-5 h-5" />
        </button>
        
        {video.isEmployer && (
          <button className="interaction-btn bg-success/20">
            <Briefcase className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Video info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarImage src={video.user.avatar} />
            <AvatarFallback className="bg-primary text-white">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{video.user.name}</h3>
            <p className="text-xs text-white/80">{video.user.role}</p>
          </div>
          <button className="btn-ghost ml-auto text-xs">
            {video.isEmployer ? 'View Job' : 'Connect'}
          </button>
        </div>
        
        <h2 className="font-bold text-lg mb-2">{video.title}</h2>
        <p className="text-sm text-white/90 mb-3 line-clamp-2">{video.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {video.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="skill-tag bg-white/20 text-white border-white/30"
            >
              {skill}
            </span>
          ))}
          {video.skills.length > 3 && (
            <span className="text-xs text-white/70">
              +{video.skills.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;