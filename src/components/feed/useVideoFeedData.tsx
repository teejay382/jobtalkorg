
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
      // Fetch video and profile data separately to avoid join issues
      const { data: videoRow, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !videoRow) {
        console.error('Error fetching new video:', videoError);
        return;
      }

      // Fetch the uploader profile using profiles.user_id = videos.user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, account_type, company_name, email')
        .eq('user_id', videoRow.user_id)
        .single();

      if (profileError) {
        console.warn('Profile not found for user:', videoRow.user_id, profileError);
      }

      const displayName = profile?.full_name || profile?.username || profile?.email || `User ${videoRow.user_id.slice(0, 8)}`;

      const transformedVideo: Video = {
        id: videoRow.id,
        title: videoRow.title,
        description: videoRow.description || '',
        video_url: videoRow.video_url,
        thumbnail_url: videoRow.thumbnail_url || undefined,
        tags: videoRow.tags || [],
        likes_count: videoRow.likes_count || 0,
        comments_count: videoRow.comments_count || 0,
        views_count: videoRow.views_count || 0,
        created_at: videoRow.created_at,
        user: {
          id: profile?.user_id || videoRow.user_id,
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

      // Fetch videos first
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

      // Fetch all unique user profiles
      const userIds = [...new Set(videosData.map(video => video.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, account_type, company_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map for quick profile lookup
      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const transformedVideos: Video[] = videosData.map((video: any) => {
        const profile = profilesMap.get(video.user_id);
        const displayName = profile?.full_name || profile?.username || profile?.email || `User ${video.user_id.slice(0, 8)}`;
        
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
