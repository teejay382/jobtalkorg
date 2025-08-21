import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
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
}

export const useVideoFeedData = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndPrependNewVideo = async (videoId: string) => {
    try {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_user_id_fkey (
            user_id,
            full_name,
            username,
            avatar_url,
            account_type,
            company_name,
            email
          )
        `)
        .eq('id', videoId)
        .single();

      if (videoError || !videoData) {
        console.error('Error fetching new video:', videoError);
        return;
      }

      const profile = videoData.profiles;
      const displayName = profile?.full_name || profile?.username || profile?.email || 'Unknown User';

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
          id: profile?.user_id || videoData.user_id,
          full_name: displayName,
          username: profile?.username || undefined,
          avatar_url: profile?.avatar_url || undefined,
          account_type: profile?.account_type || undefined,
          company_name: profile?.company_name || undefined,
          email: profile?.email || undefined,
        },
      };

      setVideos(prevVideos => [transformedVideo, ...prevVideos]);
    } catch (error) {
      console.error('Error fetching new video:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('[VideoFeed] Fetching videos with profiles');

      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_user_id_fkey (
            user_id,
            full_name,
            username,
            avatar_url,
            account_type,
            company_name,
            email
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
        console.log('[VideoFeed] No videos found');
        setVideos([]);
        setError('No videos available');
        return;
      }

      console.log('[VideoFeed] Found videos with profiles:', videosData.length);

      const transformedVideos: Video[] = videosData.map((video: any) => {
        const profile = video.profiles;
        const displayName = profile?.full_name || profile?.username || profile?.email || 'Unknown User';
        
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
            id: profile?.user_id || video.user_id,
            full_name: displayName,
            username: profile?.username || undefined,
            avatar_url: profile?.avatar_url || undefined,
            account_type: profile?.account_type || undefined,
            company_name: profile?.company_name || undefined,
            email: profile?.email || undefined,
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

  const updateVideoStats = (videoId: string, updates: { likes_count?: number; comments_count?: number }) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId 
          ? { ...video, ...updates }
          : video
      )
    );
  };

  useEffect(() => {
    fetchVideos();
    
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
          updateVideoStats(payload.new.id, {
            likes_count: payload.new.likes_count,
            comments_count: payload.new.comments_count
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    videos,
    loading,
    error,
    fetchVideos
  };
};
