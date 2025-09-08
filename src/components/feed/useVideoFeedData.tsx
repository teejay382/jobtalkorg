import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [hasMore, setHasMore] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, any>>(new Map());

  const fetchAndPrependNewVideo = useCallback(async (videoId: string) => {
    try {
      const { data: videoRow, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !videoRow) {
        console.error('Error fetching new video:', videoError);
        return;
      }

      // Check cache first
      let profile = profileCache.get(videoRow.user_id);
      if (!profile) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, email, avatar_url, account_type, company_name')
          .eq('user_id', videoRow.user_id)
          .single();
        
        if (profileError) {
          console.warn('Profile not found for user:', videoRow.user_id, profileError);
        } else {
          profile = profileData;
          // Cache the profile
          setProfileCache(prev => new Map(prev).set(videoRow.user_id, profile));
        }
      }

      const emailPrefix = profile?.email ? String(profile.email).split('@')[0] : undefined;
      const displayName = profile?.username || profile?.full_name || emailPrefix || `User ${videoRow.user_id.slice(0, 8)}`;

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
  }, [profileCache]);

  const fetchVideos = useCallback(async (offset = 0, limit = 10) => {
    try {
      if (offset === 0) setLoading(true);
      console.log('[VideoFeed] Fetching videos with profiles', { offset, limit });

      // Fetch videos with pagination
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        setError('Failed to load videos');
        return [];
      }

      if (!videosData || videosData.length === 0) {
        console.log('[VideoFeed] No videos found');
        if (offset === 0) {
          setVideos([]);
          setError('No videos available');
        }
        return [];
      }

      console.log('[VideoFeed] Found videos:', videosData.length);

      // Get unique user IDs from videos that aren't already cached
      const uncachedUserIds = [...new Set(videosData.map(video => video.user_id))]
        .filter(userId => !profileCache.has(userId));

      // Fetch only uncached profiles
      let newProfiles: any[] = [];
      if (uncachedUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, email, avatar_url, account_type, company_name')
          .in('user_id', uncachedUserIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        } else {
          newProfiles = profilesData || [];
        }
      }

      // Update profile cache with new profiles
      if (newProfiles.length > 0) {
        setProfileCache(prev => {
          const newCache = new Map(prev);
          newProfiles.forEach(profile => {
            newCache.set(profile.user_id, profile);
          });
          return newCache;
        });
      }

      const transformedVideos: Video[] = videosData.map((video: any) => {
        const profile = profileCache.get(video.user_id) || newProfiles.find(p => p.user_id === video.user_id);
        const emailPrefix = profile?.email ? String(profile.email).split('@')[0] : undefined;
        const displayName = profile?.username || profile?.full_name || emailPrefix || `User ${video.user_id.slice(0, 8)}`;
        
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

      if (offset === 0) {
        setVideos(transformedVideos);
      } else {
        setVideos(prev => [...prev, ...transformedVideos]);
      }
      setError(null);
      return transformedVideos;
    } catch (error) {
      console.error('Error in fetchVideos:', error);
      setError('An error occurred while loading videos');
      return [];
    } finally {
      if (offset === 0) setLoading(false);
    }
  }, [profileCache]);

  const updateVideoStats = useCallback((videoId: string, updates: { likes_count?: number; comments_count?: number }) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId 
          ? { ...video, ...updates }
          : video
      )
    );
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const newVideos = await fetchVideos(videos.length);
    if (newVideos.length < 10) {
      setHasMore(false);
    }
  }, [videos.length, hasMore, loading, fetchVideos]);

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
  }, [fetchAndPrependNewVideo, updateVideoStats, fetchVideos]);

  const memoizedVideos = useMemo(() => videos, [videos]);

  return {
    videos: memoizedVideos,
    loading,
    error,
    fetchVideos: () => fetchVideos(),
    loadMore,
    hasMore
  };
};