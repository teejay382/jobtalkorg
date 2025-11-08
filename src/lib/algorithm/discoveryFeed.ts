/**
 * Discovery Feed Algorithm
 * Blends local and global content relevance with personalization
 */

import { supabase } from '@/integrations/supabase/client';
import { cosineSimilarity } from './embeddingsService';
import { calculateJTS } from './jtsAlgorithm';

// ============================================================================
// TYPES
// ============================================================================

export interface FeedWeights {
  relevance: number;
  engagement: number;
  freshness: number;
  diversity: number;
  local: number;
}

export interface FeedItem {
  contentId: string;
  contentType: 'video' | 'post' | 'job' | 'profile';
  userId: string;
  username: string;
  title: string;
  thumbnailUrl?: string;
  scores: FeedScores;
  isLocal: boolean;
  isTrending: boolean;
  explanation: string;
}

export interface FeedScores {
  relevance: number;
  engagement: number;
  freshness: number;
  diversity: number;
  local: number;
  total: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_FEED_WEIGHTS: FeedWeights = {
  relevance: 0.30,
  engagement: 0.25,
  freshness: 0.20,
  diversity: 0.15,
  local: 0.10,
};

async function getFeedWeights(): Promise<FeedWeights> {
  const { data } = await supabase
    .from('algorithm_config')
    .select('config_value')
    .eq('config_name', 'feed_weights_v1')
    .eq('is_active', true)
    .single();

  return data?.config_value as FeedWeights || DEFAULT_FEED_WEIGHTS;
}

// ============================================================================
// RELEVANCE SCORING
// ============================================================================

/**
 * Calculate content relevance based on user interests and past interactions
 */
async function calculateRelevanceScore(
  userId: string,
  contentId: string,
  contentType: string
): Promise<number> {
  // Get user's profile embedding
  const { data: userEmbed } = await supabase
    .from('profile_embeddings')
    .select('combined_embedding')
    .eq('user_id', userId)
    .single();

  // Get content embedding
  const { data: contentEmbed } = await supabase
    .from('content_embeddings')
    .select('combined_embedding')
    .eq('content_id', contentId)
    .single();

  let semanticScore = 50; // Default neutral score

  if (userEmbed?.combined_embedding && contentEmbed?.combined_embedding) {
    try {
      const similarity = cosineSimilarity(
        JSON.parse(userEmbed.combined_embedding),
        JSON.parse(contentEmbed.combined_embedding)
      );
      semanticScore = similarity * 100;
    } catch (error) {
      console.warn('Could not calculate semantic similarity:', error);
    }
  }

  // Get behavioral signals
  const { data: interactions } = await supabase
    .from('engagement_events')
    .select('event_type, target_id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Check if user has engaged with similar content
  let behavioralScore = 50;
  if (interactions && interactions.length > 0) {
    const similarContent = interactions.filter(i => i.target_id === contentId);
    if (similarContent.length > 0) {
      behavioralScore = 70; // User has shown interest
    }
  }

  // Combine scores (70% semantic, 30% behavioral)
  return (semanticScore * 0.7) + (behavioralScore * 0.3);
}

// ============================================================================
// ENGAGEMENT SCORING
// ============================================================================

/**
 * Calculate engagement score for content
 */
async function calculateContentEngagement(
  contentId: string,
  contentType: string
): Promise<number> {
  if (contentType === 'video') {
    const { data: video } = await supabase
      .from('videos')
      .select('views_count, likes_count, comments_count')
      .eq('id', contentId)
      .single();

    if (!video) return 0;

    // Normalized engagement formula
    const engagementRate = video.views_count > 0
      ? ((video.likes_count + video.comments_count * 2) / video.views_count) * 100
      : 0;

    return Math.min(100, engagementRate * 10); // Scale up but cap at 100
  }

  return 50; // Default for other content types
}

// ============================================================================
// FRESHNESS SCORING
// ============================================================================

/**
 * Calculate freshness score based on content age
 */
function calculateFreshnessScore(createdAt: string): number {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  // Exponential decay function
  if (ageInHours < 6) return 100; // Very fresh
  if (ageInHours < 24) return 90;
  if (ageInHours < 72) return 70; // 3 days
  if (ageInHours < 168) return 50; // 1 week
  if (ageInHours < 720) return 30; // 1 month
  return 10; // Older content
}

// ============================================================================
// DIVERSITY SCORING
// ============================================================================

/**
 * Calculate diversity score to avoid echo chambers
 */
async function calculateDiversityScore(
  userId: string,
  contentCreatorId: string,
  seenContentIds: string[]
): Promise<number> {
  // Check if user has seen this creator before (recently)
  const { data: recentInteractions } = await supabase
    .from('engagement_events')
    .select('target_id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const hasSeenCreator = recentInteractions?.some(i => 
    seenContentIds.includes(i.target_id)
  );

  // Boost score for new creators
  return hasSeenCreator ? 40 : 80;
}

// ============================================================================
// LOCAL SCORING
// ============================================================================

/**
 * Calculate local relevance score based on geography
 */
async function calculateLocalScore(
  userId: string,
  contentCreatorId: string
): Promise<{ score: number; isLocal: boolean }> {
  // Get user location
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('latitude, longitude, location_city')
    .eq('user_id', userId)
    .single();

  // Get content creator location
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('latitude, longitude, location_city, service_type')
    .eq('user_id', contentCreatorId)
    .single();

  if (!userProfile || !creatorProfile) {
    return { score: 50, isLocal: false };
  }

  // Check if same city
  if (userProfile.location_city && 
      userProfile.location_city.toLowerCase() === creatorProfile.location_city?.toLowerCase()) {
    return { score: 100, isLocal: true };
  }

  // Calculate distance if coordinates available
  if (userProfile.latitude && creatorProfile.latitude) {
    const distance = calculateDistance(
      userProfile.latitude,
      userProfile.longitude,
      creatorProfile.latitude,
      creatorProfile.longitude
    );

    if (distance <= 10) return { score: 100, isLocal: true };
    if (distance <= 25) return { score: 80, isLocal: true };
    if (distance <= 50) return { score: 60, isLocal: false };
    if (distance <= 100) return { score: 40, isLocal: false };
  }

  return { score: 20, isLocal: false };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// TRENDING DETECTION
// ============================================================================

/**
 * Detect if content is trending
 */
async function isTrending(contentId: string, contentType: string): Promise<boolean> {
  if (contentType === 'video') {
    const { data: video } = await supabase
      .from('videos')
      .select('views_count, likes_count, created_at')
      .eq('id', contentId)
      .single();

    if (!video) return false;

    const ageInHours = (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
    
    // Trending if: recent + high engagement
    if (ageInHours < 48) {
      const engagementVelocity = (video.likes_count + video.views_count) / (ageInHours + 1);
      return engagementVelocity > 100; // Threshold for trending
    }
  }

  return false;
}

// ============================================================================
// FEED GENERATION
// ============================================================================

/**
 * Generate personalized discovery feed for a user
 */
export async function generateDiscoveryFeed(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<FeedItem[]> {
  const weights = await getFeedWeights();

  // Get candidate content (videos for now, can expand to posts/jobs)
  const { data: videos } = await supabase
    .from('videos')
    .select(`
      id, 
      user_id, 
      title, 
      thumbnail_url, 
      created_at,
      profiles!inner(username)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit * 3); // Get more than needed for filtering

  if (!videos) return [];

  // Track seen content for diversity
  const seenContentIds: string[] = [];

  // Score each item
  const scoredItems = await Promise.all(
    videos.map(async (video) => {
      const [
        relevance,
        engagement,
        localData,
        diversity,
        trending,
      ] = await Promise.all([
        calculateRelevanceScore(userId, video.id, 'video'),
        calculateContentEngagement(video.id, 'video'),
        calculateLocalScore(userId, video.user_id),
        calculateDiversityScore(userId, video.user_id, seenContentIds),
        isTrending(video.id, 'video'),
      ]);

      const freshness = calculateFreshnessScore(video.created_at);

      // Calculate total score
      const totalScore =
        (relevance * weights.relevance) +
        (engagement * weights.engagement) +
        (freshness * weights.freshness) +
        (diversity * weights.diversity) +
        (localData.score * weights.local);

      // Add to seen list
      seenContentIds.push(video.id);

      // Generate explanation
      const explanation = generateFeedExplanation({
        relevance,
        engagement,
        freshness,
        diversity,
        local: localData.score,
        total: totalScore,
      }, localData.isLocal, trending);

      return {
        contentId: video.id,
        contentType: 'video' as const,
        userId: video.user_id,
        username: (video.profiles as any).username,
        title: video.title,
        thumbnailUrl: video.thumbnail_url,
        scores: {
          relevance,
          engagement,
          freshness,
          diversity,
          local: localData.score,
          total: totalScore,
        },
        isLocal: localData.isLocal,
        isTrending: trending,
        explanation,
      };
    })
  );

  // Sort by total score and apply diversity filter
  return scoredItems
    .sort((a, b) => b.scores.total - a.scores.total)
    .filter((item, index, array) => {
      // Ensure diversity - don't show too many from same creator
      const sameCreatorCount = array
        .slice(0, index)
        .filter(i => i.userId === item.userId).length;
      return sameCreatorCount < 2; // Max 2 items per creator in feed
    })
    .slice(0, limit);
}

/**
 * Cache discovery feed for user
 */
export async function cacheDiscoveryFeed(userId: string): Promise<void> {
  const feed = await generateDiscoveryFeed(userId, 100);

  const feedData = feed.map(item => ({
    content_id: item.contentId,
    content_type: item.contentType,
    total_score: item.scores.total,
    is_local: item.isLocal,
    is_trending: item.isTrending,
  }));

  await supabase
    .from('feed_cache')
    .upsert({
      user_id: userId,
      feed_data: feedData,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      version: 1,
    });
}

/**
 * Get cached feed or generate new one
 */
export async function getDiscoveryFeed(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<FeedItem[]> {
  // Try to get from cache first
  const { data: cache } = await supabase
    .from('feed_cache')
    .select('feed_data, expires_at')
    .eq('user_id', userId)
    .single();

  if (cache && new Date(cache.expires_at) > new Date()) {
    // Cache is valid, use it
    const cachedData = cache.feed_data as any[];
    return cachedData.slice(offset, offset + limit).map(item => ({
      contentId: item.content_id,
      contentType: item.content_type,
      userId: '', // Would need to fetch details
      username: '',
      title: '',
      scores: {
        relevance: 0,
        engagement: 0,
        freshness: 0,
        diversity: 0,
        local: 0,
        total: item.total_score,
      },
      isLocal: item.is_local,
      isTrending: item.is_trending,
      explanation: '',
    }));
  }

  // Cache expired or doesn't exist, generate new feed
  const feed = await generateDiscoveryFeed(userId, limit, offset);
  
  // Cache in background (don't wait)
  cacheDiscoveryFeed(userId).catch(console.error);

  return feed;
}

// ============================================================================
// RANDOM DISCOVERY BOOST
// ============================================================================

/**
 * Get random content for discovery (helps new users and content)
 */
export async function getRandomDiscovery(limit: number = 10): Promise<FeedItem[]> {
  const { data: videos } = await supabase
    .from('videos')
    .select(`
      id, 
      user_id, 
      title, 
      thumbnail_url, 
      created_at,
      profiles!inner(username)
    `)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (!videos) return [];

  // Shuffle and take random items
  const shuffled = videos.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map(video => ({
    contentId: video.id,
    contentType: 'video' as const,
    userId: video.user_id,
    username: (video.profiles as any).username,
    title: video.title,
    thumbnailUrl: video.thumbnail_url,
    scores: {
      relevance: 50,
      engagement: 50,
      freshness: calculateFreshnessScore(video.created_at),
      diversity: 100,
      local: 50,
      total: 60,
    },
    isLocal: false,
    isTrending: false,
    explanation: 'Random discovery to explore new content',
  }));
}

// ============================================================================
// HELPERS
// ============================================================================

function generateFeedExplanation(
  scores: FeedScores,
  isLocal: boolean,
  isTrending: boolean
): string {
  const reasons: string[] = [];

  if (scores.relevance > 70) reasons.push('highly relevant to your interests');
  if (scores.engagement > 70) reasons.push('popular with other users');
  if (scores.freshness > 80) reasons.push('newly posted');
  if (isLocal) reasons.push('from your local area');
  if (isTrending) reasons.push('trending right now');
  if (scores.diversity > 70) reasons.push('discover new creator');

  if (reasons.length === 0) {
    return 'Recommended based on overall platform activity';
  }

  return `Recommended because it's ${reasons.join(', ')}`;
}

/**
 * Blend local and global content (50/50 mix)
 */
export async function getBlendedFeed(
  userId: string,
  limit: number = 50
): Promise<FeedItem[]> {
  const localLimit = Math.floor(limit * 0.5);
  const globalLimit = limit - localLimit;

  const feed = await generateDiscoveryFeed(userId, limit);

  // Separate local and global
  const localFeed = feed.filter(item => item.isLocal).slice(0, localLimit);
  const globalFeed = feed.filter(item => !item.isLocal).slice(0, globalLimit);

  // Interleave them
  const blended: FeedItem[] = [];
  const maxLength = Math.max(localFeed.length, globalFeed.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < localFeed.length) blended.push(localFeed[i]);
    if (i < globalFeed.length) blended.push(globalFeed[i]);
  }

  return blended.slice(0, limit);
}
