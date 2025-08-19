
import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share, Briefcase, User, Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

  const isEmployer = video.user.account_type === 'employer';
  const displayName = video.user.full_name || video.user.username || 'Anonymous User';
  const userRole = isEmployer ? (video.user.company_name || 'Employer') : 'Job Seeker';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        poster={video.thumbnail_url}
        onClick={handleVideoClick}
      />
      
      {/* Video overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>
      )}
      
      {/* Right side interactions */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-4 z-10">
        <button 
          onClick={handleLike}
          disabled={loading}
          className={`interaction-btn ${isLiked ? 'text-red-500' : 'text-white'} ${loading ? 'opacity-50' : ''}`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <span className="text-white text-xs font-medium text-center">{likesCount}</span>
        
        <button className="interaction-btn text-white">
          <MessageCircle className="w-6 h-6" />
        </button>
        <span className="text-white text-xs font-medium text-center">{video.comments_count}</span>
        
        <button onClick={handleShare} className="interaction-btn text-white">
          <Share className="w-6 h-6" />
        </button>
        
        {isEmployer && (
          <button className="interaction-btn bg-success/20 text-success">
            <Briefcase className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-16 p-4 text-white z-10">
        {/* User info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarImage src={video.user.avatar_url} />
            <AvatarFallback className="bg-primary text-white">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{displayName}</h3>
            <p className="text-xs text-white/80 truncate">{userRole}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="btn-ghost text-xs px-4 py-1 h-auto"
          >
            {isEmployer ? 'View Job' : 'Connect'}
          </Button>
        </div>
        
        {/* Video title */}
        <h2 className="font-bold text-base mb-2 line-clamp-2">{video.title}</h2>
        
        {/* Description */}
        <p className="text-sm text-white/90 mb-3 line-clamp-2">{video.description}</p>
        
        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="skill-tag bg-white/20 text-white border-white/30 text-xs px-2 py-1"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-white/70">
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
