/**
 * JTS (JobTolk Score) Service
 * Calculates comprehensive scoring for users and job matches
 * 
 * Score Components:
 * - Skill Match (35%): How well user skills match job requirements
 * - Engagement (25%): User's content engagement metrics
 * - Credibility (25%): Profile completion, ratings, verification
 * - Recency (15%): Recent activity boost
 */

import { supabase } from '@/integrations/supabase/client';
import { cosineSimilarity } from './embeddingsService';

// Default JTS weights
export interface JTSWeights {
  skill_match: number;
  engagement: number;
  credibility: number;
  recency: number;
}

export const DEFAULT_WEIGHTS: JTSWeights = {
  skill_match: 0.35,
  engagement: 0.25,
  credibility: 0.25,
  recency: 0.15,
};

export interface JTSComponents {
  skillMatchScore: number;
  engagementScore: number;
  credibilityScore: number;
  recencyBoost: number;
  totalJTS: number;
  breakdown?: {
    skillMatches?: string[];
    partialMatches?: string[];
    missingSkills?: string[];
  };
}

/**
 * Get JTS weights from database or use defaults
 */
async function getJTSWeights(): Promise<JTSWeights> {
  try {
    // Table will exist after migrations
    const { data, error } = await (supabase as any)
      .from('algorithm_config')
      .select('config_value')
      .eq('config_name', 'jts_weights_v1')
      .single();

    if (error || !data) return DEFAULT_WEIGHTS;

    const weights = (data as any).config_value as unknown as JTSWeights;
    return {
      skill_match: weights.skill_match ?? DEFAULT_WEIGHTS.skill_match,
      engagement: weights.engagement ?? DEFAULT_WEIGHTS.engagement,
      credibility: weights.credibility ?? DEFAULT_WEIGHTS.credibility,
      recency: weights.recency ?? DEFAULT_WEIGHTS.recency,
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Calculate skill match score between user and job
 * Returns 0-100 score
 */
async function calculateSkillMatchScore(
  userId: string,
  jobId: string
): Promise<{ score: number; breakdown: JTSComponents['breakdown'] }> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, service_categories')
      .eq('user_id', userId)
      .single();

    // Get job requirements
    const { data: job } = await supabase
      .from('jobs')
      .select('requirements, category')
      .eq('id', jobId)
      .single();

    if (!profile || !job) return { score: 50, breakdown: {} };

    const profileData = profile as any;
    const jobData = job as any;
    const userSkills = Array.isArray(profileData.skills) ? profileData.skills : [];
    const requiredSkills = Array.isArray(jobData.skills_required) ? jobData.skills_required : [];

    if (requiredSkills.length === 0) {
      return { score: 75, breakdown: {} }; // No specific requirements
    }

    // Calculate exact matches
    const exactMatches: string[] = [];
    const partialMatches: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      
      // Check for exact match
      const exactMatch = userSkills.some(
        userSkill => userSkill.toLowerCase() === reqSkillLower
      );

      if (exactMatch) {
        exactMatches.push(reqSkill);
      } else {
        // Check for partial match (fuzzy)
        const partialMatch = userSkills.some(userSkill => {
          const userSkillLower = userSkill.toLowerCase();
          return (
            userSkillLower.includes(reqSkillLower) ||
            reqSkillLower.includes(userSkillLower)
          );
        });

        if (partialMatch) {
          partialMatches.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
        }
      }
    });

    // Calculate score
    const exactMatchWeight = 1.0;
    const partialMatchWeight = 0.5;
    
    const totalWeight =
      exactMatches.length * exactMatchWeight +
      partialMatches.length * partialMatchWeight;
    
    const maxWeight = requiredSkills.length * exactMatchWeight;
    const matchRatio = maxWeight > 0 ? totalWeight / maxWeight : 0;

    // Category bonus (if user's categories match job category)
    let categoryBonus = 0;
    if (jobData.category && Array.isArray(profileData.service_categories)) {
      const hasMatchingCategory = profileData.service_categories.some(
        cat => cat.toLowerCase() === jobData.category.toLowerCase()
      );
      if (hasMatchingCategory) {
        categoryBonus = 0.1; // 10% bonus
      }
    }

    const finalScore = Math.min(100, (matchRatio + categoryBonus) * 100);

    return {
      score: finalScore,
      breakdown: {
        skillMatches: exactMatches,
        partialMatches: partialMatches,
        missingSkills: missingSkills,
      },
    };
  } catch (error) {
    console.error('Skill match calculation failed:', error);
    return { score: 50, breakdown: {} };
  }
}

/**
 * Calculate semantic similarity score using embeddings
 * Returns 0-100 score
 */
async function calculateSemanticSimilarity(
  userId: string,
  jobId: string
): Promise<number> {
  try {
    // Get profile embedding (table will exist after migrations)
    const { data: profileEmbed } = await (supabase as any)
      .from('profile_embeddings')
      .select('combined_embedding')
      .eq('user_id', userId)
      .single();

    // Get job embedding (table will exist after migrations)
    const { data: jobEmbed } = await (supabase as any)
      .from('job_embeddings')
      .select('combined_embedding')
      .eq('job_id', jobId)
      .single();

    if (!profileEmbed || !jobEmbed) return 50;

    const similarity = cosineSimilarity(
      (profileEmbed as any).combined_embedding as unknown as number[],
      (jobEmbed as any).combined_embedding as unknown as number[]
    );

    // Convert from [-1, 1] to [0, 100]
    return ((similarity + 1) / 2) * 100;
  } catch {
    return 50;
  }
}

/**
 * Calculate engagement score for a user
 * Based on last 30 days of activity
 * Returns 0-100 score
 */
async function calculateEngagementScore(userId: string): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent video performance
    const { data: videos } = await supabase
      .from('videos')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!videos || videos.length === 0) return 25;

    // Count likes on user's videos
    const videoIds = videos.map(v => v.id);
    const { count: likesCount } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIds);

    // Count comments on user's videos
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIds);

    const totalViews = videos.length * 10; // Approximate views based on video count
    const totalLikes = likesCount || 0;
    const totalComments = commentsCount || 0;

    // Weighted scoring
    const viewsScore = Math.min(50, (totalViews / 100) * 10); // 100 views = 10 points
    const likesScore = Math.min(30, (totalLikes / 20) * 10); // 20 likes = 10 points
    const commentsScore = Math.min(20, (totalComments / 10) * 10); // 10 comments = 10 points

    return Math.min(100, viewsScore + likesScore + commentsScore);
  } catch (error) {
    console.error('Engagement calculation failed:', error);
    return 25;
  }
}

/**
 * Calculate credibility score for a user
 * Returns 0-100 score
 */
async function calculateCredibilityScore(userId: string): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('bio, avatar_url, full_name')
      .eq('user_id', userId)
      .single();

    if (!profile) return 40;

    const profileData = profile as any;
    let score = 0;

    // Profile completion (40 points)
    if (profileData.bio && profileData.bio.length > 50) score += 15;
    if (profileData.avatar_url) score += 10;
    if (profileData.full_name) score += 15;

    // Verification status (30 points)
    if (profileData.is_verified) score += 30;

    // Get completed jobs and ratings
    const { data: completedJobs, count: jobsCount } = await (supabase as any)
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('freelancer_id', userId)
      .eq('status', 'completed');

    // Jobs completed (15 points)
    const jobsScore = Math.min(15, (jobsCount || 0) * 3);
    score += jobsScore;

    // Average rating (15 points)
    if (completedJobs && completedJobs.length > 0) {
      const ratings = completedJobs
        .map((j: any) => j.ratings)
        .filter((r: any) => r !== null && r !== undefined);
      
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        score += (avgRating / 5) * 15; // Normalize to 15 points
      }
    }

    return Math.min(100, score);
  } catch (error) {
    console.error('Credibility calculation failed:', error);
    return 40;
  }
}

/**
 * Calculate recency boost
 * Returns 0-15 points based on last activity
 */
async function calculateRecencyBoost(userId: string): Promise<number> {
  try {
    const { data: videos } = await supabase
      .from('videos')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!videos || videos.length === 0) return 0;

    const lastActivity = new Date(videos[0].created_at);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 24) return 15; // Last 24 hours
    if (hoursSinceActivity < 24 * 7) return 10; // Last 7 days
    if (hoursSinceActivity < 24 * 30) return 5; // Last 30 days
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate complete JTS score for a user-job match
 */
export async function scoreJobMatch(
  userId: string,
  jobId: string
): Promise<JTSComponents> {
  try {
    const weights = await getJTSWeights();

    // Calculate all components
    const [skillMatchResult, semanticScore, engagementScore, credibilityScore, recencyBoost] =
      await Promise.all([
        calculateSkillMatchScore(userId, jobId),
        calculateSemanticSimilarity(userId, jobId),
        calculateEngagementScore(userId),
        calculateCredibilityScore(userId),
        calculateRecencyBoost(userId),
      ]);

    // Combine skill match with semantic similarity
    const combinedSkillScore = (skillMatchResult.score * 0.7) + (semanticScore * 0.3);

    // Calculate weighted total
    const totalJTS =
      combinedSkillScore * weights.skill_match +
      engagementScore * weights.engagement +
      credibilityScore * weights.credibility +
      recencyBoost * weights.recency;

    const components: JTSComponents = {
      skillMatchScore: Number(combinedSkillScore.toFixed(2)),
      engagementScore: Number(engagementScore.toFixed(2)),
      credibilityScore: Number(credibilityScore.toFixed(2)),
      recencyBoost: Number(recencyBoost.toFixed(2)),
      totalJTS: Number(totalJTS.toFixed(2)),
      breakdown: skillMatchResult.breakdown,
    };

    // Cache the score in database (table will exist after migrations)
    await (supabase as any)
      .from('job_match_jts')
      .upsert({
        user_id: userId,
        job_id: jobId,
        skill_match_score: components.skillMatchScore,
        engagement_score: components.engagementScore,
        credibility_score: components.credibilityScore,
        recency_boost: components.recencyBoost,
        total_jts: components.totalJTS,
        calculated_at: new Date().toISOString(),
      });

    return components;
  } catch (error) {
    console.error('JTS calculation failed:', error);
    throw error;
  }
}

/**
 * Get cached JTS score or calculate if not available
 */
export async function getJobMatchScore(
  userId: string,
  jobId: string
): Promise<JTSComponents> {
  try {
    // Try to get cached score (valid for 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Table will exist after migrations
    const { data: cached } = await (supabase as any)
      .from('job_match_jts')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .gte('calculated_at', twentyFourHoursAgo.toISOString())
      .single();

    if (cached) {
      const cachedData = cached as any;
      return {
        skillMatchScore: cachedData.skill_match_score,
        engagementScore: cachedData.engagement_score,
        credibilityScore: cachedData.credibility_score,
        recencyBoost: cachedData.recency_boost,
        totalJTS: cachedData.total_jts,
      };
    }

    // Calculate fresh score
    return await scoreJobMatch(userId, jobId);
  } catch {
    // If cache lookup fails, calculate fresh
    return await scoreJobMatch(userId, jobId);
  }
}

/**
 * Refresh a user's overall JTS score
 * This is their general score, not tied to a specific job
 */
export async function refreshUserScore(userId: string): Promise<void> {
  try {
    const [engagementScore, credibilityScore, recencyBoost] = await Promise.all([
      calculateEngagementScore(userId),
      calculateCredibilityScore(userId),
      calculateRecencyBoost(userId),
    ]);

    // For overall score, we don't have a specific job to match against
    // So skill_match_avg represents their general skill breadth
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills')
      .eq('user_id', userId)
      .single();

    const skillCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
    const skillMatchAvg = Math.min(100, skillCount * 10); // 10 points per skill, max 100

    const weights = await getJTSWeights();
    const totalJTS =
      skillMatchAvg * weights.skill_match +
      engagementScore * weights.engagement +
      credibilityScore * weights.credibility +
      recencyBoost * weights.recency;

    // Update user's overall score (table will exist after migrations)
    await (supabase as any)
      .from('user_jts_scores')
      .upsert({
        user_id: userId,
        skill_match_avg: Number(skillMatchAvg.toFixed(2)),
        engagement_score: Number(engagementScore.toFixed(2)),
        credibility_score: Number(credibilityScore.toFixed(2)),
        recency_boost: Number(recencyBoost.toFixed(2)),
        total_jts: Number(totalJTS.toFixed(2)),
        updated_at: new Date().toISOString(),
      });

    console.log(`✓ User JTS score refreshed for ${userId}: ${totalJTS.toFixed(2)}`);
  } catch (error) {
    console.error('Failed to refresh user score:', error);
    throw error;
  }
}

/**
 * Batch refresh scores for multiple users
 */
export async function batchRefreshUserScores(userIds: string[]): Promise<void> {
  const results = await Promise.allSettled(
    userIds.map(userId => refreshUserScore(userId))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`${failed.length} user scores failed to refresh`);
  }

  console.log(`✓ Batch refreshed ${userIds.length - failed.length}/${userIds.length} user scores`);
}
