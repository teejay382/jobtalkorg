
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
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !videoData) {
        console.error('Error fetching new video:', videoError);
        return;
      }

      // Use a direct query instead of RPC for profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, account_type, company_name')
        .eq('user_id', videoData.user_id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile for new video:', profileError);
      }

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

      setVideos(prevVideos => [transformedVideo, ...prevVideos]);
    } catch (error) {
      console.error('Error fetching new video:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('[VideoFeed] Fetching videos');

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

      const userIds = Array.from(
        new Set(
          videosData
            .map((v: any) => v.user_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      console.log('[VideoFeed] Found userIds for profiles:', userIds);

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
        // Fetch profiles using direct query instead of RPC
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url, account_type, company_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        } else if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.user_id, profile);
          });
        }

        console.log('[VideoFeed] Found profiles:', profilesMap.size);
      }

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
