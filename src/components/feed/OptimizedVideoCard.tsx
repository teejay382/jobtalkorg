import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Heart, MessageCircle, Share, Briefcase, Play, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, getProfileRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CommentSection } from './CommentSection';
import { HireModal } from '@/components/hire/HireModal';
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
  const [showHireModal, setShowHireModal] = useState(false);
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

  // Optimized video playback - autoplay muted videos when active and visible
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isVisible) {
      // Try to autoplay (browsers allow muted autoplay)
      videoRef.current.play().catch((error) => {
        // If autoplay fails, show play button but don't log error for expected behavior
        if (error.name !== 'NotAllowedError') {
          console.warn('Video play failed:', error);
        }
        setIsPlaying(false);
      });
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
    
    // Security check: verify user is employer
    const userRole = getProfileRole(profile);
    if (userRole !== 'employer') {
      toast({
        title: "Access denied",
        description: "Only employers can hire freelancers",
        variant: "destructive",
      });
      return;
    }
    
    setShowHireModal(true);
  }, [user, profile, toast]);

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

  const handleDelete = useCallback(async () => {
    if (!user || video.user.id !== user.id) {
      toast({
        title: "Error",
        description: "You can only delete your own videos",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('[VideoCard] Deleting video:', video.id);
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      // Extract file path from video URL for storage deletion
      if (video.video_url) {
        try {
          const url = new URL(video.video_url);
          const pathParts = url.pathname.split('/');
          const videosIndex = pathParts.indexOf('videos');
          
          if (videosIndex !== -1 && videosIndex < pathParts.length - 1) {
            const videoFilePath = pathParts.slice(videosIndex + 1).join('/');
            
            const { error: storageError } = await supabase.storage
              .from('videos')
              .remove([videoFilePath]);
            
            if (storageError) {
              console.warn('[VideoCard] Storage deletion warning:', storageError);
            }
          }
        } catch (urlError) {
          console.warn('[VideoCard] URL parsing warning:', urlError);
        }
      }

      // Delete thumbnail from storage if it exists
      if (video.thumbnail_url) {
        try {
          const url = new URL(video.thumbnail_url);
          const pathParts = url.pathname.split('/');
          const thumbnailsIndex = pathParts.indexOf('thumbnails');
          
          if (thumbnailsIndex !== -1 && thumbnailsIndex < pathParts.length - 1) {
            const thumbnailFilePath = pathParts.slice(thumbnailsIndex + 1).join('/');
            
            const { error: thumbnailError } = await supabase.storage
              .from('thumbnails')
              .remove([thumbnailFilePath]);
            
            if (thumbnailError) {
              console.warn('[VideoCard] Thumbnail deletion warning:', thumbnailError);
            }
          }
        } catch (urlError) {
          console.warn('[VideoCard] Thumbnail URL parsing warning:', urlError);
        }
      }

      toast({
        title: "Video deleted",
        description: "Your video has been successfully deleted.",
      });

      // Refresh the feed to remove the deleted video
      onRefresh();
    } catch (error) {
      console.error('[VideoCard] Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, video, toast, onRefresh]);

  // Memoized computed values - optimized for performance
  const isVideoFromEmployer = useMemo(() => 
    (video.user.role || (video.user as any).account_type) === 'employer',
    [video.user.role, (video.user as any).account_type]
  );
  
  const isCurrentUserEmployer = useMemo(() => 
    getProfileRole(profile) === 'employer',
    [profile]
  );
  
  const displayName = useMemo(() => 
    video.user.full_name || video.user.username || `User ${video.user.id.slice(0, 8)}`,
    [video.user.full_name, video.user.username, video.user.id]
  );
  
  const userRole = useMemo(() => 
    isVideoFromEmployer ? (video.user.company_name || 'Employer') : 'Freelancer',
    [isVideoFromEmployer, video.user.company_name]
  );
  
  // CRITICAL: Only show hire button if:
  // 1. Current user is an employer
  // 2. Video is from a freelancer (not employer)
  // 3. User is not viewing their own video
  const shouldShowHireButton = useMemo(() => 
    isCurrentUserEmployer && !isVideoFromEmployer && user?.id !== video.user.id,
    [isCurrentUserEmployer, isVideoFromEmployer, user?.id, video.user.id]
  );
  
  const isOwnVideo = useMemo(() => 
    user && video.user.id === user.id,
    [user, video.user.id]
  );

  // Validate video URL - must be HTTPS Supabase URL
  const isValidVideoUrl = video.video_url && 
    video.video_url.trim() !== '' &&
    (video.video_url.includes('supabase.co') || video.video_url.startsWith('http'));

  // Log video info for debugging
  useEffect(() => {
    if (!isValidVideoUrl) {
      console.warn('[VideoCard] Invalid video URL:', video.video_url, 'for video:', video.id);
    }
  }, [video.video_url, video.id, isValidVideoUrl]);

  return (
  <div className="relative w-full h-full bg-black overflow-hidden">
    {/* Video container with 9:16 aspect ratio */}
    <div className="absolute inset-0 flex items-center justify-center">
      {isVisible && isValidVideoUrl && !videoError ? (
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onClick={handleVideoClick}
          preload="none"
          crossOrigin="anonymous"
          onLoadedData={() => {
            console.log('[VideoCard] Video loaded successfully:', video.id);
            setVideoLoaded(true);
          }}
          onError={(e) => {
            const videoElement = e.currentTarget;
            console.error('[VideoCard] Video failed to load:', {
              url: video.video_url,
              videoId: video.id,
              error: videoElement.error,
              networkState: videoElement.networkState,
              readyState: videoElement.readyState
            });
            setVideoError(true);
            // Hide the video element on error
            e.currentTarget.style.display = 'none';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : videoError ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center p-6 glass-card rounded-lg max-w-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-2">Video unavailable</p>
            <p className="text-white/60 text-xs">This video could not be loaded</p>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full bg-center bg-contain bg-no-repeat bg-black"
          style={{
            backgroundImage: video.thumbnail_url ? `url(${video.thumbnail_url})` : 'none',
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
      
      {/* Delete button - only show for own videos */}
      {isOwnVideo && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute top-4 left-4 glass-card rounded-2xl p-3 text-white bg-red-500/80 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-300 z-20 hover:scale-110 backdrop-blur-sm"
              title="Delete video"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card-premium border-2 border-red-500/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Delete Video?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Are you sure you want to delete "{video.title}"? This action cannot be undone and will permanently remove the video from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:bg-secondary">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
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
                className="glass-card text-primary text-[10px] px-2 py-0.5 rounded-full font-medium hover:shadow-neon-blue transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground flex items-center font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] glass-card px-1.5 py-0.5 rounded-full">
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

      {/* Hire Modal */}
      <HireModal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        freelancer={{
          id: video.user.id,
          full_name: video.user.full_name,
          username: video.user.username,
          avatar_url: video.user.avatar_url,
          email: video.user.email,
        }}
      />
    </div>
  );
});

OptimizedVideoCard.displayName = 'OptimizedVideoCard';

export default OptimizedVideoCard;