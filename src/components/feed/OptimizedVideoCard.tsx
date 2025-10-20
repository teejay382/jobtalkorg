import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Heart, MessageCircle, Share, Briefcase, Play, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, getProfileRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CommentSection } from './CommentSection';

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
  role?: string;
      company_name?: string;
      email?: string;
    };
  };
  isActive: boolean;
  onRefresh: () => void;
  isVisible: boolean;
  isMobile?: boolean;
}

const OptimizedVideoCard = memo(({ video, isActive, onRefresh, isVisible, isMobile = true }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [commentsCount, setCommentsCount] = useState(video.comments_count);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Preload video when visible
  useEffect(() => {
    if (isVisible && videoRef.current && !videoLoaded) {
      videoRef.current.preload = 'metadata';
      setVideoLoaded(true);
    }
  }, [isVisible, videoLoaded]);

  // Check if liked - memoized
  const checkIfLiked = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', video.id)
        .eq('user_id', user.id)
        .maybeSingle(); // Better than single() for performance

      setIsLiked(!!data);
    } catch (error) {
      setIsLiked(false);
    }
  }, [video.id, user]);

  useEffect(() => {
    checkIfLiked();
  }, [checkIfLiked]);

  // Optimized video playback
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isVisible) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, isVisible]);

  // Memoized handlers
  const handleLike = useCallback(async () => {
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
        // Optimistic update
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));

        await Promise.all([
          supabase
            .from('video_likes')
            .delete()
            .eq('video_id', video.id)
            .eq('user_id', user.id),
          supabase
            .from('videos')
            .update({ likes_count: Math.max(0, likesCount - 1) })
            .eq('id', video.id)
        ]);
      } else {
        // Optimistic update
        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        await Promise.all([
          supabase
            .from('video_likes')
            .insert({ video_id: video.id, user_id: user.id }),
          supabase
            .from('videos')
            .update({ likes_count: likesCount + 1 })
            .eq('id', video.id)
        ]);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(video.likes_count);
      
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isLiked, likesCount, video.id, video.likes_count, toast]);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
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
  }, [video.title, video.description, toast]);

  const handleHire = useCallback(() => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to hire freelancers",
        variant: "destructive",
      });
      return;
    }
    navigate(`/chat?user=${video.user.id}`);
  }, [user, video.user.id, navigate, toast]);

  const handleComment = useCallback(() => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }
    setShowComments(true);
  }, [user, toast]);

  const handleCommentAdded = useCallback(() => {
    setCommentsCount(prev => prev + 1);
    onRefresh();
  }, [onRefresh]);

  // Memoized computed values
  const isVideoFromEmployer = (video.user.role || (video.user as any).account_type) === 'employer';
  const isCurrentUserEmployer = getProfileRole(profile) === 'employer';
  const displayName = video.user.full_name || video.user.username || `User ${video.user.id.slice(0, 8)}`;
  const userRole = isVideoFromEmployer ? (video.user.company_name || 'Employer') : 'Job Seeker';
  const shouldShowHireButton = !isVideoFromEmployer && isCurrentUserEmployer;

  // Validate video URL
  const isValidVideoUrl = video.video_url && video.video_url.trim() !== '';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video container with 9:16 aspect ratio */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isVisible && isValidVideoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={video.video_url}
            className="w-full h-full object-contain"
            loop
            muted={isMuted}
            playsInline
            poster={video.thumbnail_url}
            onClick={handleVideoClick}
            preload="none"
            onLoadedData={() => setVideoLoaded(true)}
            onError={(e) => {
              console.warn('Video failed to load:', video.video_url);
              setVideoError(true);
              // Hide the video element on error
              e.currentTarget.style.display = 'none';
            }}
            style={{ aspectRatio: '9/16' }}
          />
        ) : (
          <div
            className="w-full h-full bg-center bg-contain bg-no-repeat bg-black"
            style={{
              backgroundImage: `url(${video.thumbnail_url})`,
              aspectRatio: '9/16'
            }}
          />
        )}
      </div>
      
      {/* Enhanced video overlay with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
      
      {/* Play indicator when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="glass-card rounded-full p-6 animate-fade-in">
            <Play className="w-16 h-16 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" fill="white" />
          </div>
        </div>
      )}
      
      {/* Mute/Unmute button with glassmorphism */}
      <button
        onClick={handleMuteToggle}
        className="absolute top-4 right-4 glass-card rounded-2xl p-3 text-white hover:shadow-neon-blue transition-all duration-300 z-20 hover:scale-110"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      
      {/* Right side interactions with neon effects - Medium-small balanced size */}
      <div className="absolute right-3 bottom-20 md:bottom-24 flex flex-col gap-2.5 md:gap-3 z-20">
        <div className="flex flex-col items-center gap-1 animate-fade-in">
          <button 
            onClick={handleLike}
            disabled={loading}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-lg glass-card flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              isLiked 
                ? 'text-red-400 shadow-[0_0_25px_rgba(248,113,113,0.5)]' 
                : 'text-white hover:shadow-neon-purple'
            } ${loading ? 'opacity-50' : ''}`}
          >
            <Heart className={`w-5 h-5 md:w-5.5 md:h-5.5 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2.5} />
          </button>
          <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] bg-black/40 px-1.5 py-0.5 rounded-full">{likesCount}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <button 
            onClick={handleComment}
            className="w-10 h-10 md:w-11 md:h-11 rounded-lg glass-card flex items-center justify-center text-white hover:shadow-neon-blue transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="w-5 h-5 md:w-5.5 md:h-5.5" strokeWidth={2.5} />
          </button>
          <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] bg-black/40 px-1.5 py-0.5 rounded-full">{commentsCount}</span>
        </div>
        
        <button 
          onClick={handleShare} 
          className="w-10 h-10 md:w-11 md:h-11 rounded-lg glass-card flex items-center justify-center text-white hover:shadow-neon-purple transition-all duration-300 hover:scale-110 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <Share className="w-5 h-5 md:w-5.5 md:h-5.5" strokeWidth={2.5} />
        </button>
      </div>
      
      {/* Bottom content - Compact username card */}
      <div className="absolute bottom-0 left-0 right-14 md:right-16 p-2.5 md:p-3 pb-16 md:pb-20 text-white z-10">
        {/* User info with subtle glassmorphism - more compact and semi-transparent */}
        <div className="inline-flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-black/25 backdrop-blur-sm border border-white/5 animate-fade-in max-w-[240px]">
          <Avatar className="w-7 h-7 md:w-8 md:h-8 ring-1 ring-primary/30">
            <AvatarImage src={video.user.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-[10px] font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] truncate">{displayName}</h3>
            <p className="text-[10px] text-white/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] truncate">{userRole}</p>
          </div>
          {shouldShowHireButton && (
            <Button
              onClick={handleHire}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-neon-blue hover:shadow-neon-purple text-[10px] px-2 py-1 h-auto font-bold rounded-md hover:scale-105 transition-all duration-300 shrink-0"
            >
              <Briefcase className="w-2.5 h-2.5 mr-0.5" strokeWidth={2.5} />
              Hire
            </Button>
          )}
        </div>
        
        {/* Video title with strong contrast - more compact */}
        <h2 className="font-bold text-sm md:text-base mb-1.5 text-white leading-tight line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          {video.title}
        </h2>
        
        {/* Description with enhanced readability - more compact */}
        {video.description && (
          <p className="text-[10px] md:text-xs text-white/85 mb-1.5 leading-relaxed line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {video.description}
          </p>
        )}
        
        {/* Tags with neon accents - more compact */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 animate-fade-in">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="glass-card text-white text-[10px] px-2 py-0.5 rounded-full font-medium hover:shadow-neon-blue transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-[10px] text-white/75 flex items-center font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] glass-card px-1.5 py-0.5 rounded-full">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Comment Section */}
      <CommentSection
        videoId={video.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
});

OptimizedVideoCard.displayName = 'OptimizedVideoCard';

export default OptimizedVideoCard;