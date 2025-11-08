/**
 * Jobtolk Score (JTS) Algorithm
 * Core ranking and matching engine
 * 
 * Formula: JTS = (Skill Match × 0.35) + (Engagement Score × 0.25) + 
 *                (Credibility Score × 0.25) + (Recency Boost × 0.15)
 */

import { supabase } from '@/integrations/supabase/client';
import { cosineSimilarity } from './embeddingsService';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface JTSWeights {
  skill_match: number;
  engagement: number;
  credibility: number;
  recency: number;
}

export interface JTSComponents {
  skillMatchScore: number;
  engagementScore: number;
  credibilityScore: number;
  recencyBoost: number;
  totalJTS: number;
}

export interface JobMatchResult {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  skills: string[];
  jtsScore: JTSComponents;
  locationScore: number;
  embeddingSimilarity: number;
  explanation: RankingExplanation;
}

export interface RankingExplanation {
  summary: string;
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  scoreBreakdown: Record<string, number>;
  reasoning: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_WEIGHTS: JTSWeights = {
  skill_match: 0.35,
  engagement: 0.25,
  credibility: 0.25,
  recency: 0.15,
};

/**
 * Get current algorithm weights from database
 */
async function getAlgorithmWeights(): Promise<JTSWeights> {
  const { data } = await supabase
    .from('algorithm_config')
    .select('config_value')
    .eq('config_name', 'jts_weights_v1')
    .eq('is_active', true)
    .single();

  return data?.config_value as JTSWeights || DEFAULT_WEIGHTS;
}

// ============================================================================
// SKILL MATCHING
// ============================================================================

/**
 * Calculate skill match score using both keyword matching and embeddings
 */
export async function calculateSkillMatch(
  userSkills: string[],
  requiredSkills: string[],
  userId?: string,
  jobId?: string
): Promise<number> {
  // Method 1: Keyword-based matching (fast, explainable)
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase());

  const matchedSkills = normalizedRequiredSkills.filter(skill =>
    normalizedUserSkills.some(userSkill => 
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  );

  const keywordScore = normalizedRequiredSkills.length > 0
    ? (matchedSkills.length / normalizedRequiredSkills.length) * 100
    : 100;

  // Method 2: Embedding-based semantic similarity (if available)
  let embeddingScore = 50; // Default neutral score

  if (userId && jobId) {
    try {
      const { data: profileEmb } = await supabase
        .from('profile_embeddings')
        .select('combined_embedding')
        .eq('user_id', userId)
        .single();

      const { data: jobEmb } = await supabase
        .from('job_embeddings')
        .select('combined_embedding')
        .eq('job_id', jobId)
        .single();

      if (profileEmb?.combined_embedding && jobEmb?.combined_embedding) {
        const similarity = cosineSimilarity(
          JSON.parse(profileEmb.combined_embedding),
          JSON.parse(jobEmb.combined_embedding)
        );
        embeddingScore = similarity * 100;
      }
    } catch (error) {
      console.warn('Could not calculate embedding similarity:', error);
    }
  }

  // Combine both methods (60% keyword, 40% embedding)
  const finalScore = (keywordScore * 0.6) + (embeddingScore * 0.4);
  return Math.min(100, Math.max(0, finalScore));
}

// ============================================================================
// ENGAGEMENT SCORING
// ============================================================================

/**
 * Calculate engagement score based on user interactions
 */
export async function calculateEngagementScore(userId: string): Promise<number> {
  const { data: events } = await supabase
    .from('engagement_events')
    .select('event_type')
    .in('target_id', 
      supabase.from('videos').select('id').eq('user_id', userId)
    )
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!events || events.length === 0) return 50; // Neutral for new users

  // Weight different engagement types
  const weights = {
    view: 1,
    like: 3,
    comment: 5,
    share: 10,
    save: 7,
    click: 2,
  };

  let totalScore = 0;
  events.forEach(event => {
    totalScore += weights[event.event_type as keyof typeof weights] || 0;
  });

  // Normalize to 0-100 scale (logarithmic to avoid extreme values)
  const normalizedScore = Math.min(100, (Math.log10(totalScore + 1) / Math.log10(1000)) * 100);
  return normalizedScore;
}

/**
 * Calculate user's content engagement metrics
 */
export async function getUserEngagementMetrics(userId: string) {
  const { data: videos } = await supabase
    .from('videos')
    .select('likes_count, comments_count, views_count, shares_count')
    .eq('user_id', userId);

  if (!videos || videos.length === 0) {
    return { totalViews: 0, totalLikes: 0, totalComments: 0, avgEngagement: 0 };
  }

  const totalViews = videos.reduce((sum, v) => sum + (v.views_count || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comments_count || 0), 0);
  const totalShares = videos.reduce((sum, v) => sum + ((v as any).shares_count || 0), 0);

  const avgEngagement = totalViews > 0
    ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
    : 0;

  return { totalViews, totalLikes, totalComments, totalShares, avgEngagement };
}

// ============================================================================
// CREDIBILITY SCORING
// ============================================================================

/**
 * Calculate credibility score based on trust signals
 */
export async function calculateCredibilityScore(userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, role')
    .eq('user_id', userId)
    .single();

  const { data: stats } = await supabase
    .from('user_statistics')
    .select('avg_rating, total_ratings, total_jobs_completed, response_rate')
    .eq('user_id', userId)
    .single();

  let score = 0;

  // Component 1: Ratings (40 points max)
  if (stats?.avg_rating && stats.total_ratings > 0) {
    const ratingScore = ((stats.avg_rating - 1) / 4) * 40;
    const confidenceBoost = Math.min(1, stats.total_ratings / 10); // More ratings = more confidence
    score += ratingScore * confidenceBoost;
  } else {
    score += 20; // Neutral for no ratings
  }

  // Component 2: Completion History (30 points max)
  if (stats?.total_jobs_completed) {
    score += Math.min(30, stats.total_jobs_completed * 3);
  }

  // Component 3: Profile Completeness (20 points max)
  if (profile?.onboarding_completed) {
    score += 20;
  }

  // Component 4: Response Rate (10 points max)
  if (stats?.response_rate) {
    score += (stats.response_rate / 100) * 10;
  }

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// RECENCY BOOST
// ============================================================================

/**
 * Calculate recency boost based on recent activity
 */
export async function calculateRecencyBoost(userId: string): Promise<number> {
  const { data: recentVideo } = await supabase
    .from('videos')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentVideo) return 0;

  const hoursSincePost = (Date.now() - new Date(recentVideo.created_at).getTime()) / (1000 * 60 * 60);

  // Decay function for recency boost
  if (hoursSincePost < 24) return 15; // Posted in last 24 hours
  if (hoursSincePost < 168) return 10; // Posted in last week
  if (hoursSincePost < 720) return 5; // Posted in last month
  return 0;
}

// ============================================================================
// JTS CALCULATION
// ============================================================================

/**
 * Calculate complete JTS score for a user
 */
export async function calculateJTS(
  userId: string,
  jobId?: string,
  requiredSkills?: string[]
): Promise<JTSComponents> {
  const weights = await getAlgorithmWeights();

  // Get user skills
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, service_categories')
    .eq('user_id', userId)
    .single();

  const userSkills = [
    ...(profile?.skills || []),
    ...(profile?.service_categories || []),
  ];

  // Calculate all components
  const [skillMatchScore, engagementScore, credibilityScore, recencyBoost] = await Promise.all([
    requiredSkills 
      ? calculateSkillMatch(userSkills, requiredSkills, userId, jobId)
      : Promise.resolve(50),
    calculateEngagementScore(userId),
    calculateCredibilityScore(userId),
    calculateRecencyBoost(userId),
  ]);

  // Calculate weighted total
  const totalJTS =
    (skillMatchScore * weights.skill_match) +
    (engagementScore * weights.engagement) +
    (credibilityScore * weights.credibility) +
    (recencyBoost * weights.recency);

  return {
    skillMatchScore,
    engagementScore,
    credibilityScore,
    recencyBoost,
    totalJTS: Math.min(100, Math.max(0, totalJTS)),
  };
}

/**
 * Update JTS score in database
 */
export async function updateStoredJTS(userId: string): Promise<void> {
  const jts = await calculateJTS(userId);
  const metrics = await getUserEngagementMetrics(userId);

  await supabase
    .from('user_jts_scores')
    .upsert({
      user_id: userId,
      skill_match_avg: jts.skillMatchScore,
      engagement_score: jts.engagementScore,
      credibility_score: jts.credibilityScore,
      recency_boost: jts.recencyBoost,
      total_jts: jts.totalJTS,
      total_views: metrics.totalViews,
      total_likes: metrics.totalLikes,
      total_comments: metrics.totalComments,
      updated_at: new Date().toISOString(),
    });
}

// ============================================================================
// JOB MATCHING
// ============================================================================

/**
 * Find best matches for a job using JTS
 */
export async function findJobMatches(
  jobId: string,
  limit: number = 50
): Promise<JobMatchResult[]> {
  // Get job details
  const { data: job } = await supabase
    .from('jobs')
    .select('required_skills, job_type, latitude, longitude')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  // Get potential candidates
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, full_name, avatar_url, bio, skills, service_categories, latitude, longitude')
    .eq('role', 'freelancer')
    .eq('onboarding_completed', true);

  if (!profiles) return [];

  // Calculate JTS for each candidate
  const matches = await Promise.all(
    profiles.map(async (profile) => {
      const jts = await calculateJTS(profile.user_id, jobId, job.required_skills);

      // Calculate location score
      let locationScore = 50;
      if (job.job_type !== 'remote' && job.latitude && profile.latitude) {
        const distance = calculateDistance(
          job.latitude,
          job.longitude,
          profile.latitude,
          profile.longitude
        );
        locationScore = getLocationScore(distance);
      }

      // Get embedding similarity if available
      let embeddingSimilarity = 0.5;
      try {
        const { data } = await supabase.rpc('calculate_embedding_similarity', {
          p_user_id: profile.user_id,
          p_job_id: jobId,
        });
        embeddingSimilarity = data || 0.5;
      } catch (error) {
        // Embeddings not available
      }

      // Generate explanation
      const explanation = generateMatchExplanation(jts, locationScore, embeddingSimilarity, job, profile);

      return {
        userId: profile.user_id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        skills: [...(profile.skills || []), ...(profile.service_categories || [])],
        jtsScore: jts,
        locationScore,
        embeddingSimilarity,
        explanation,
      };
    })
  );

  // Filter and sort by JTS
  return matches
    .filter(m => m.jtsScore.totalJTS >= 40) // Minimum threshold
    .sort((a, b) => b.jtsScore.totalJTS - a.jtsScore.totalJTS)
    .slice(0, limit);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function getLocationScore(distance: number): number {
  if (distance <= 10) return 100;
  if (distance <= 25) return 80;
  if (distance <= 50) return 50;
  return 20;
}

function generateMatchExplanation(
  jts: JTSComponents,
  locationScore: number,
  similarity: number,
  job: any,
  profile: any
): RankingExplanation {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  // Analyze skill match
  if (jts.skillMatchScore >= 70) {
    positive.push(`Strong skill match (${jts.skillMatchScore.toFixed(0)}%)`);
  } else if (jts.skillMatchScore >= 40) {
    neutral.push(`Moderate skill match (${jts.skillMatchScore.toFixed(0)}%)`);
  } else {
    negative.push(`Limited skill match (${jts.skillMatchScore.toFixed(0)}%)`);
  }

  // Analyze engagement
  if (jts.engagementScore >= 60) {
    positive.push(`High engagement (${jts.engagementScore.toFixed(0)}/100)`);
  } else if (jts.engagementScore < 30) {
    negative.push(`Low engagement history`);
  }

  // Analyze credibility
  if (jts.credibilityScore >= 70) {
    positive.push(`Highly credible (${jts.credibilityScore.toFixed(0)}/100)`);
  } else if (jts.credibilityScore < 40) {
    neutral.push(`Building credibility (${jts.credibilityScore.toFixed(0)}/100)`);
  }

  // Analyze recency
  if (jts.recencyBoost > 10) {
    positive.push('Recently active');
  } else if (jts.recencyBoost === 0) {
    negative.push('Inactive recently');
  }

  // Location
  if (locationScore >= 80) {
    positive.push('Nearby location');
  } else if (locationScore < 50) {
    negative.push('Distant location');
  }

  const summary = `Matched with ${jts.totalJTS.toFixed(0)}% confidence based on skills, engagement, and credibility`;

  return {
    summary,
    factors: { positive, negative, neutral },
    scoreBreakdown: {
      'Skill Match': jts.skillMatchScore,
      'Engagement': jts.engagementScore,
      'Credibility': jts.credibilityScore,
      'Recency': jts.recencyBoost,
      'Total JTS': jts.totalJTS,
    },
    reasoning: `This freelancer was recommended because they have ${positive.join(', ')}. ${
      negative.length > 0 ? `However, note that they have ${negative.join(', ')}.` : ''
    }`,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Update JTS scores for all users (background job)
 */
export async function batchUpdateJTSScores(limit: number = 100): Promise<void> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'freelancer')
    .limit(limit);

  if (!profiles) return;

  for (const profile of profiles) {
    try {
      await updateStoredJTS(profile.user_id);
    } catch (error) {
      console.error(`Failed to update JTS for user ${profile.user_id}:`, error);
    }
  }
}
