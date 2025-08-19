
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoCard from './VideoCard';

interface Video {
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
}

const VideoFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url,
            account_type,
            company_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        setError('Failed to load videos');
        return;
      }

      if (!videosData || videosData.length === 0) {
        setVideos([]);
        setError('No videos available');
        return;
      }

      // Transform the data to match our Video interface
      const transformedVideos: Video[] = videosData.map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        tags: video.tags || [],
        likes_count: video.likes_count || 0,
        comments_count: video.comments_count || 0,
        views_count: video.views_count || 0,
        created_at: video.created_at,
        user: {
          id: video.profiles?.id || video.user_id,
          full_name: video.profiles?.full_name || 'Unknown User',
          username: video.profiles?.username,
          avatar_url: video.profiles?.avatar_url,
          account_type: video.profiles?.account_type,
          company_name: video.profiles?.company_name,
        }
      }));

      setVideos(transformedVideos);
      setError(null);
    } catch (error) {
      console.error('Error in fetchVideos:', error);
      setError('An error occurred while loading videos');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentVideo < videos.length - 1) {
      setCurrentVideo(currentVideo + 1);
    } else if (direction === 'up' && currentVideo > 0) {
      setCurrentVideo(currentVideo - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleScroll('down');
    } else {
      handleScroll('up');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touchStartY = e.touches[0].clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touchEndY = moveEvent.touches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h3 className="text-xl font-semibold mb-2">
            {error || 'No videos available'}
          </h3>
          <p className="text-white/70 mb-4">
            {videos.length === 0 
              ? 'Be the first to upload a video!' 
              : 'Please try again later.'
            }
          </p>
          <button 
            onClick={fetchVideos}
            className="bg-primary px-6 py-2 rounded-full text-white font-medium hover:bg-primary/80 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full overflow-hidden relative bg-black"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
    >
      <div 
        className="flex flex-col transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateY(-${currentVideo * 100}vh)` }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="w-full h-screen flex-shrink-0">
            <VideoCard 
              video={video} 
              isActive={index === currentVideo}
              onRefresh={fetchVideos}
            />
          </div>
        ))}
      </div>
      
      {/* Scroll indicators - only show if there are multiple videos */}
      {videos.length > 1 && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`w-1 h-6 rounded-full transition-all duration-300 ${
                index === currentVideo 
                  ? 'bg-white w-1.5' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              onClick={() => setCurrentVideo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
