/**
 * JTS (Jobtolk Score) Service
 * Calculates and manages Jobtolk scores for users and job matches
 */

import { supabase } from '@/integrations/supabase/client';

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

export interface JobMatchJTS extends JTSComponents {
  jobId: string;
  userId: string;
  locationScore?: number;
  embeddingSimilarity?: number;
  explanation?: any;
}

/**
 * Get JTS weights from configuration
 */
async function getJTSWeights(): Promise<JTSWeights> {
  try {
    const { data, error } = await supabase
      .from('algorithm_config')
      .select('config_value')
      .eq('config_name', 'jts_weights_v1')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Return default weights if config not found
      return {
        skill_match: 0.35,
        engagement: 0.25,
        credibility: 0.25,
        recency: 0.15,
      };
    }

    return data.config_value as JTSWeights;
  } catch (error) {
    console.error('Error fetching JTS weights:', error);
    return {
      skill_match: 0.35,
      engagement: 0.25,
      credibility: 0.25,
      recency: 0.15,
    };
  }
}

/**
 * Calculate JTS score for a user-job match
 */
export async function calculateJTS(
  userId: string,
  jobId: string
): Promise<JTSComponents> {
  try {
    const weights = await getJTSWeights();

    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('required_skills, service_categories')
      .eq('id', jobId)
      .single();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, service_categories')
      .eq('user_id', userId)
      .single();

    if (!job || !profile) {
      throw new Error('Job or profile not found');
    }

    // Calculate skill match score
    const skillMatchScore = calculateSkillMatch(
      profile.skills || [],
      job.required_skills || []
    );

    // Calculate engagement score (from user_jts_scores if exists)
    let engagementScore = 50.0;
    const { data: jtsData } = await supabase
      .from('user_jts_scores')
      .select('engagement_score')
      .eq('user_id', userId)
      .single();

    if (jtsData) {
      engagementScore = jtsData.engagement_score || 50.0;
    }

    // Calculate credibility score
    let credibilityScore = 50.0;
    const { data: credData } = await supabase
      .from('user_jts_scores')
      .select('credibility_score')
      .eq('user_id', userId)
      .single();

    if (credData) {
      credibilityScore = credData.credibility_score || 50.0;
    }

    // Calculate recency boost
    const recencyBoost = await calculateRecencyBoost(userId);

    // Calculate total JTS
    const totalJTS =
      skillMatchScore * weights.skill_match +
      engagementScore * weights.engagement +
      credibilityScore * weights.credibility +
      recencyBoost * weights.recency;

    return {
      skillMatchScore,
      engagementScore,
      credibilityScore,
      recencyBoost,
      totalJTS,
    };
  } catch (error) {
    console.error('Error calculating JTS:', error);
    // Return default scores on error
    return {
      skillMatchScore: 50,
      engagementScore: 50,
      credibilityScore: 50,
      recencyBoost: 0,
      totalJTS: 50,
    };
  }
}

/**
 * Calculate skill match score between user skills and job requirements
 */
function calculateSkillMatch(userSkills: string[], jobSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 50.0;
  if (!userSkills || userSkills.length === 0) return 0.0;

  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  let matchCount = 0;
  let partialMatchCount = 0;

  jobSkillsLower.forEach(jobSkill => {
    // Exact match
    if (userSkillsLower.includes(jobSkill)) {
      matchCount++;
    } else {
      // Partial match (fuzzy)
      const hasPartialMatch = userSkillsLower.some(userSkill =>
        userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
      );
      if (hasPartialMatch) {
        partialMatchCount++;
      }
    }
  });

  // Score: exact matches count more than partial matches
  const exactScore = (matchCount / jobSkillsLower.length) * 100;
  const partialScore = (partialMatchCount / jobSkillsLower.length) * 50;

  return Math.min(100, exactScore + partialScore);
}

/**
 * Calculate recency boost based on recent activity
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

    const lastPostDate = new Date(videos[0].created_at);
    const now = new Date();
    const hoursSincePost = (now.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60);

    if (hoursSincePost < 24) return 15.0;
    if (hoursSincePost < 24 * 7) return 10.0;
    if (hoursSincePost < 24 * 30) return 5.0;
    return 0.0;
  } catch (error) {
    console.error('Error calculating recency boost:', error);
    return 0;
  }
}

/**
 * Update and store JTS score for a job match
 */
export async function updateStoredJTS(
  userId: string,
  jobId: string
): Promise<void> {
  try {
    const jts = await calculateJTS(userId, jobId);

    // Note: This will fail if the table doesn't exist yet
    // The table is created by the migration
    await supabase.from('job_match_jts').upsert({
      job_id: jobId,
      user_id: userId,
      skill_match_score: jts.skillMatchScore,
      engagement_score: jts.engagementScore,
      credibility_score: jts.credibilityScore,
      recency_boost: jts.recencyBoost,
      total_jts: jts.totalJTS,
      calculated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing JTS:', error);
    // Silent fail if table doesn't exist yet
  }
}

/**
 * Get stored JTS score for a job match
 */
export async function getStoredJTS(
  userId: string,
  jobId: string
): Promise<JTSComponents | null> {
  try {
    const { data, error } = await supabase
      .from('job_match_jts')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (error || !data) return null;

    return {
      skillMatchScore: data.skill_match_score,
      engagementScore: data.engagement_score,
      credibilityScore: data.credibility_score,
      recencyBoost: data.recency_boost,
      totalJTS: data.total_jts,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Update user's overall JTS score
 */
export async function updateUserJTS(userId: string): Promise<void> {
  try {
    // Call the database function
    await supabase.rpc('update_user_jts_score', { p_user_id: userId });
  } catch (error) {
    console.error('Error updating user JTS:', error);
  }
}
