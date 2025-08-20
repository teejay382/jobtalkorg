
import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share, Briefcase, User, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    tags?: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    created_at: string;
    user: {
      id: string;
      full_name: string;
      username?: string;
      avatar_url?: string;
      account_type?: string;
      company_name?: string;
      email?: string;
    };
  };
  isActive: boolean;
  onRefresh: () => void;
}

const VideoCard = ({ video, isActive, onRefresh }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkIfLiked();
  }, [video.id, user]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', video.id)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // User hasn't liked this video
      setIsLiked(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like videos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', user.id);

        // Update video likes count
        await supabase
          .from('videos')
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq('id', video.id);

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        await supabase
          .from('video_likes')
          .insert({ video_id: video.id, user_id: user.id });

        // Update video likes count
        await supabase
          .from('videos')
          .update({ likes_count: likesCount + 1 })
          .eq('id', video.id);

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Copied!",
          description: "Video link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share video",
        variant: "destructive",
      });
    }
  };

  const handleConnect = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to connect with other users",
        variant: "destructive",
      });
      return;
    }

    // Navigate to chat with the video uploader
    navigate(`/chat?user=${video.user.id}`);
  };

  const isEmployer = video.user.account_type === 'employer';
  const displayName = video.user.full_name || video.user.email || 'Unknown User';
  const userRole = isEmployer ? (video.user.company_name || 'Employer') : 'Job Seeker';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video - improved TikTok/Reels style layout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-contain bg-black"
          loop
          muted
          playsInline
          poster={video.thumbnail_url}
          onClick={handleVideoClick}
        />
      </div>
      
      {/* Video overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      
      {/* Play indicator when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>
      )}
      
      {/* Right side interactions */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-10">
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleLike}
            disabled={loading}
            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              isLiked ? 'text-red-500 bg-red-500/20' : 'text-white bg-white/20 hover:bg-white/30'
            } ${loading ? 'opacity-50' : ''}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <span className="text-white text-xs font-medium">{likesCount}</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110">
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-white text-xs font-medium">{video.comments_count}</span>
        </div>
        
        <button 
          onClick={handleShare} 
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
        >
          <Share className="w-6 h-6" />
        </button>
        
        {isEmployer && (
          <button className="w-12 h-12 rounded-full bg-success/20 backdrop-blur-sm flex items-center justify-center text-success hover:bg-success/30 transition-all duration-300 hover:scale-110">
            <Briefcase className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Bottom content - improved layout and readability */}
      <div className="absolute bottom-0 left-0 right-20 p-4 text-white z-10">
        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-white/30">
            <AvatarImage src={video.user.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-primary text-white text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-white truncate">{displayName}</h3>
            <p className="text-sm text-white/80 truncate">{userRole}</p>
          </div>
          <Button
            onClick={handleConnect}
            variant="outline"
            size="sm"
            className="bg-white text-black border-white hover:bg-white/90 hover:text-black text-xs px-4 py-2 h-auto font-medium"
          >
            Connect
          </Button>
        </div>
        
        {/* Video title */}
        <h2 className="font-bold text-lg mb-2 text-white leading-tight line-clamp-2">{video.title}</h2>
        
        {/* Description */}
        {video.description && (
          <p className="text-sm text-white/90 mb-3 leading-relaxed line-clamp-3">{video.description}</p>
        )}
        
        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 text-xs px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-white/70 flex items-center font-medium">
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
