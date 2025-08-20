
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
    
    // Set up real-time subscription for new videos
    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'videos'
        },
        async (payload) => {
          console.log('[VideoFeed] New video inserted:', payload);
          // Fetch the complete video data with user profile
          await fetchAndPrependNewVideo(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos'
        },
        (payload) => {
          console.log('[VideoFeed] Video updated:', payload);
          // Update the video in the current list
          setVideos(prevVideos => 
            prevVideos.map(video => 
              video.id === payload.new.id 
                ? { ...video, likes_count: payload.new.likes_count, comments_count: payload.new.comments_count }
                : video
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAndPrependNewVideo = async (videoId: string) => {
    try {
      // Fetch the new video with profile data
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !videoData) {
        console.error('Error fetching new video:', videoError);
        return;
      }

      // Fetch the user profile using the security definer function
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile', { target_user_id: videoData.user_id });

      if (profileError) {
        console.warn('Error fetching profile for new video:', profileError);
      }

      // Transform the video data
      const transformedVideo: Video = {
        id: videoData.id,
        title: videoData.title,
        description: videoData.description || '',
        video_url: videoData.video_url,
        thumbnail_url: videoData.thumbnail_url || undefined,
        tags: videoData.tags || [],
        likes_count: videoData.likes_count || 0,
        comments_count: videoData.comments_count || 0,
        views_count: videoData.views_count || 0,
        created_at: videoData.created_at,
        user: {
          id: profileData?.user_id || videoData.user_id,
          full_name: profileData?.full_name || 'Unknown User',
          username: profileData?.username || undefined,
          avatar_url: profileData?.avatar_url || undefined,
          account_type: profileData?.account_type || undefined,
          company_name: profileData?.company_name || undefined,
        },
      };

      // Add the new video to the beginning of the list
      setVideos(prevVideos => [transformedVideo, ...prevVideos]);
    } catch (error) {
      console.error('Error fetching new video:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('[VideoFeed] Fetching videos');

      // Fetch videos first, ordered by created_at DESC (newest first)
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        setError('Failed to load videos');
        return;
      }

      if (!videosData || videosData.length === 0) {
        console.log('[VideoFeed] No videos found');
        setVideos([]);
        setError('No videos available');
        return;
      }

      console.log('[VideoFeed] Found videos:', videosData.length);

      // Collect unique user_ids to fetch profiles using the security definer function
      const userIds = Array.from(
        new Set(
          videosData
            .map((v: any) => v.user_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      console.log('[VideoFeed] Found userIds for profiles:', userIds);

      // Fetch profiles using the security definer function
      let profilesMap = new Map<
        string,
        {
          user_id: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          account_type: string | null;
          company_name: string | null;
        }
      >();

      if (userIds.length > 0) {
        // Call the security definer function for each user
        const profilePromises = userIds.map(async (userId) => {
          const { data: profileData, error: profileError } = await supabase
            .rpc('get_public_profile', { target_user_id: userId });

          if (profileError) {
            console.warn(`Error fetching profile for user ${userId}:`, profileError);
            return null;
          }

          return profileData;
        });

        const profileResults = await Promise.all(profilePromises);
        
        profileResults.forEach((profile) => {
          if (profile) {
            profilesMap.set(profile.user_id, profile);
          }
        });

        console.log('[VideoFeed] Found profiles:', profilesMap.size);
      }

      // Transform the data to match our Video interface
      const transformedVideos: Video[] = videosData.map((video: any) => {
        const profile = profilesMap.get(video.user_id);
        return {
          id: video.id,
          title: video.title,
          description: video.description || '',
          video_url: video.video_url,
          thumbnail_url: video.thumbnail_url || undefined,
          tags: video.tags || [],
          likes_count: video.likes_count || 0,
          comments_count: video.comments_count || 0,
          views_count: video.views_count || 0,
          created_at: video.created_at,
          user: {
            id: (profile?.user_id as string) || (video.user_id as string),
            full_name: (profile?.full_name as string) || 'Unknown User',
            username: (profile?.username as string) || undefined,
            avatar_url: (profile?.avatar_url as string) || undefined,
            account_type: (profile?.account_type as string) || undefined,
            company_name: (profile?.company_name as string) || undefined,
          },
        };
      });

      console.log('[VideoFeed] Transformed videos ready:', transformedVideos.length);

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
              : 'Please try again later.'}
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
                index === currentVideo ? 'bg-white w-1.5' : 'bg-white/40 hover:bg-white/60'
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
