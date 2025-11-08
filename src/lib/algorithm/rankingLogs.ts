/**
 * Explainable Ranking Logs
 * Provides transparency for all algorithm decisions
 */

import { supabase } from '@/integrations/supabase/client';
import { JTSComponents } from './jtsAlgorithm';
import { FeedScores } from './discoveryFeed';

// ============================================================================
// TYPES
// ============================================================================

export interface RankingLog {
  id: string;
  userId: string;
  logType: 'job_match' | 'feed_rank' | 'search_result' | 'recommendation';
  targetId: string;
  targetType: string;
  scoreComponents: Record<string, number>;
  totalScore: number;
  rankingPosition?: number;
  explanationText: string;
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  searchQuery?: string;
  filtersApplied?: Record<string, any>;
  createdAt: string;
}

export interface ExplanationContext {
  userProfile: any;
  targetProfile?: any;
  jobDetails?: any;
  scores: Record<string, number>;
  thresholds: Record<string, number>;
}

// ============================================================================
// LOG CREATION
// ============================================================================

/**
 * Create a ranking log for job matching
 */
export async function logJobMatch(
  userId: string,
  jobId: string,
  jtsScores: JTSComponents,
  locationScore: number,
  embeddingSimilarity: number,
  rankingPosition: number
): Promise<string> {
  const factors = analyzeJobMatchFactors(jtsScores, locationScore, embeddingSimilarity);
  
  const scoreComponents = {
    skill_match: jtsScores.skillMatchScore,
    engagement: jtsScores.engagementScore,
    credibility: jtsScores.credibilityScore,
    recency: jtsScores.recencyBoost,
    location: locationScore,
    total_jts: jtsScores.totalJTS,
  };

  const explanationText = generateJobMatchExplanation(jtsScores, locationScore, factors);

  const { data, error } = await supabase
    .from('ranking_logs')
    .insert({
      user_id: userId,
      log_type: 'job_match',
      target_id: jobId,
      target_type: 'job',
      score_components: scoreComponents,
      total_score: jtsScores.totalJTS,
      ranking_position: rankingPosition,
      explanation_text: explanationText,
      factors: factors,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create ranking log:', error);
    throw error;
  }

  return data.id;
}

/**
 * Create a ranking log for feed content
 */
export async function logFeedRanking(
  userId: string,
  contentId: string,
  contentType: string,
  scores: FeedScores,
  rankingPosition: number,
  isLocal: boolean,
  isTrending: boolean
): Promise<string> {
  const factors = analyzeFeedFactors(scores, isLocal, isTrending);
  
  const scoreComponents = {
    relevance: scores.relevance,
    engagement: scores.engagement,
    freshness: scores.freshness,
    diversity: scores.diversity,
    local: scores.local,
    total: scores.total,
  };

  const explanationText = generateFeedExplanation(scores, factors, isLocal, isTrending);

  const { data, error } = await supabase
    .from('ranking_logs')
    .insert({
      user_id: userId,
      log_type: 'feed_rank',
      target_id: contentId,
      target_type: contentType,
      score_components: scoreComponents,
      total_score: scores.total,
      ranking_position: rankingPosition,
      explanation_text: explanationText,
      factors: factors,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create feed ranking log:', error);
    throw error;
  }

  return data.id;
}

/**
 * Create a ranking log for search results
 */
export async function logSearchResult(
  userId: string,
  targetId: string,
  targetType: string,
  searchQuery: string,
  scores: Record<string, number>,
  rankingPosition: number,
  filtersApplied?: Record<string, any>
): Promise<string> {
  const factors = analyzeSearchFactors(scores, searchQuery);
  const totalScore = scores.total || Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  
  const explanationText = generateSearchExplanation(searchQuery, scores, factors);

  const { data, error } = await supabase
    .from('ranking_logs')
    .insert({
      user_id: userId,
      log_type: 'search_result',
      target_id: targetId,
      target_type: targetType,
      score_components: scores,
      total_score: totalScore,
      ranking_position: rankingPosition,
      explanation_text: explanationText,
      factors: factors,
      search_query: searchQuery,
      filters_applied: filtersApplied || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create search ranking log:', error);
    throw error;
  }

  return data.id;
}

/**
 * Create a ranking log for recommendations
 */
export async function logRecommendation(
  userId: string,
  targetId: string,
  targetType: string,
  scores: Record<string, number>,
  reason: string
): Promise<string> {
  const totalScore = scores.total || Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  
  const factors = {
    positive: [reason],
    negative: [],
    neutral: [],
  };

  const { data, error } = await supabase
    .from('ranking_logs')
    .insert({
      user_id: userId,
      log_type: 'recommendation',
      target_id: targetId,
      target_type: targetType,
      score_components: scores,
      total_score: totalScore,
      explanation_text: reason,
      factors: factors,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create recommendation log:', error);
    throw error;
  }

  return data.id;
}

// ============================================================================
// FACTOR ANALYSIS
// ============================================================================

/**
 * Analyze factors for job matching
 */
function analyzeJobMatchFactors(
  jts: JTSComponents,
  locationScore: number,
  embeddingSimilarity: number
): { positive: string[]; negative: string[]; neutral: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  // Skill Match Analysis
  if (jts.skillMatchScore >= 80) {
    positive.push(`Excellent skill match (${jts.skillMatchScore.toFixed(0)}%)`);
  } else if (jts.skillMatchScore >= 60) {
    positive.push(`Good skill alignment (${jts.skillMatchScore.toFixed(0)}%)`);
  } else if (jts.skillMatchScore >= 40) {
    neutral.push(`Moderate skill match (${jts.skillMatchScore.toFixed(0)}%)`);
  } else {
    negative.push(`Limited skill overlap (${jts.skillMatchScore.toFixed(0)}%)`);
  }

  // Engagement Analysis
  if (jts.engagementScore >= 70) {
    positive.push(`High platform engagement (${jts.engagementScore.toFixed(0)}/100)`);
  } else if (jts.engagementScore >= 40) {
    neutral.push(`Moderate engagement (${jts.engagementScore.toFixed(0)}/100)`);
  } else {
    negative.push(`Low engagement history (${jts.engagementScore.toFixed(0)}/100)`);
  }

  // Credibility Analysis
  if (jts.credibilityScore >= 80) {
    positive.push(`Highly credible with strong track record (${jts.credibilityScore.toFixed(0)}/100)`);
  } else if (jts.credibilityScore >= 60) {
    positive.push(`Established credibility (${jts.credibilityScore.toFixed(0)}/100)`);
  } else if (jts.credibilityScore >= 40) {
    neutral.push(`Building credibility (${jts.credibilityScore.toFixed(0)}/100)`);
  } else {
    neutral.push(`New user establishing presence (${jts.credibilityScore.toFixed(0)}/100)`);
  }

  // Recency Analysis
  if (jts.recencyBoost >= 10) {
    positive.push('Recently active on platform');
  } else if (jts.recencyBoost === 0) {
    negative.push('No recent activity');
  }

  // Location Analysis
  if (locationScore >= 90) {
    positive.push('Nearby location (excellent proximity)');
  } else if (locationScore >= 70) {
    positive.push('Close location (good proximity)');
  } else if (locationScore >= 40) {
    neutral.push('Moderate distance');
  } else {
    negative.push('Distant location');
  }

  // Semantic Similarity
  if (embeddingSimilarity >= 0.8) {
    positive.push('Strong semantic match with requirements');
  } else if (embeddingSimilarity >= 0.6) {
    neutral.push('Decent semantic alignment');
  }

  return { positive, negative, neutral };
}

/**
 * Analyze factors for feed ranking
 */
function analyzeFeedFactors(
  scores: FeedScores,
  isLocal: boolean,
  isTrending: boolean
): { positive: string[]; negative: string[]; neutral: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  // Relevance
  if (scores.relevance >= 70) {
    positive.push('Highly relevant to your interests');
  } else if (scores.relevance >= 40) {
    neutral.push('Moderately relevant');
  } else {
    neutral.push('Exploring new content areas');
  }

  // Engagement
  if (scores.engagement >= 70) {
    positive.push('High engagement from community');
  } else if (scores.engagement < 30) {
    negative.push('Lower community engagement');
  }

  // Freshness
  if (scores.freshness >= 80) {
    positive.push('Very recently posted');
  } else if (scores.freshness >= 50) {
    positive.push('Recent content');
  }

  // Diversity
  if (scores.diversity >= 70) {
    positive.push('Discover new creator');
  }

  // Local
  if (isLocal) {
    positive.push('From your local area');
  }

  // Trending
  if (isTrending) {
    positive.push('Trending right now');
  }

  return { positive, negative, neutral };
}

/**
 * Analyze factors for search results
 */
function analyzeSearchFactors(
  scores: Record<string, number>,
  searchQuery: string
): { positive: string[]; negative: string[]; neutral: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  if (scores.relevance && scores.relevance >= 70) {
    positive.push(`Strong match for "${searchQuery}"`);
  } else if (scores.relevance && scores.relevance >= 40) {
    neutral.push(`Partial match for search query`);
  }

  if (scores.popularity && scores.popularity >= 70) {
    positive.push('Popular choice among users');
  }

  if (scores.quality && scores.quality >= 70) {
    positive.push('High quality rating');
  }

  return { positive, negative, neutral };
}

// ============================================================================
// EXPLANATION GENERATION
// ============================================================================

/**
 * Generate human-readable explanation for job match
 */
function generateJobMatchExplanation(
  jts: JTSComponents,
  locationScore: number,
  factors: { positive: string[]; negative: string[]; neutral: string[] }
): string {
  const parts: string[] = [];

  parts.push(`This freelancer was ranked with a Jobtolk Score of ${jts.totalJTS.toFixed(0)}/100.`);

  if (factors.positive.length > 0) {
    parts.push(`\n\n✅ **Strengths:**\n- ${factors.positive.join('\n- ')}`);
  }

  if (factors.neutral.length > 0) {
    parts.push(`\n\n📊 **Considerations:**\n- ${factors.neutral.join('\n- ')}`);
  }

  if (factors.negative.length > 0) {
    parts.push(`\n\n⚠️ **Areas to Note:**\n- ${factors.negative.join('\n- ')}`);
  }

  parts.push(`\n\n**How JTS was calculated:**`);
  parts.push(`- Skill Match: ${jts.skillMatchScore.toFixed(1)} × 35% = ${(jts.skillMatchScore * 0.35).toFixed(1)}`);
  parts.push(`- Engagement: ${jts.engagementScore.toFixed(1)} × 25% = ${(jts.engagementScore * 0.25).toFixed(1)}`);
  parts.push(`- Credibility: ${jts.credibilityScore.toFixed(1)} × 25% = ${(jts.credibilityScore * 0.25).toFixed(1)}`);
  parts.push(`- Recency: ${jts.recencyBoost.toFixed(1)} × 15% = ${(jts.recencyBoost * 0.15).toFixed(1)}`);
  parts.push(`\n**Total JTS: ${jts.totalJTS.toFixed(1)}/100**`);

  return parts.join('\n');
}

/**
 * Generate human-readable explanation for feed ranking
 */
function generateFeedExplanation(
  scores: FeedScores,
  factors: { positive: string[]; negative: string[]; neutral: string[] },
  isLocal: boolean,
  isTrending: boolean
): string {
  const parts: string[] = [];

  parts.push(`This content was ranked with a score of ${scores.total.toFixed(0)}/100 in your feed.`);

  if (factors.positive.length > 0) {
    parts.push(`\n\n**Why you're seeing this:**\n- ${factors.positive.join('\n- ')}`);
  }

  parts.push(`\n\n**Score Breakdown:**`);
  parts.push(`- Relevance: ${scores.relevance.toFixed(1)}/100`);
  parts.push(`- Engagement: ${scores.engagement.toFixed(1)}/100`);
  parts.push(`- Freshness: ${scores.freshness.toFixed(1)}/100`);
  parts.push(`- Diversity: ${scores.diversity.toFixed(1)}/100`);
  parts.push(`- Local Relevance: ${scores.local.toFixed(1)}/100`);

  return parts.join('\n');
}

/**
 * Generate human-readable explanation for search results
 */
function generateSearchExplanation(
  searchQuery: string,
  scores: Record<string, number>,
  factors: { positive: string[]; negative: string[]; neutral: string[] }
): string {
  const parts: string[] = [];

  parts.push(`Result for search: "${searchQuery}"`);

  if (factors.positive.length > 0) {
    parts.push(`\n\n**Why this result:**\n- ${factors.positive.join('\n- ')}`);
  }

  parts.push(`\n\n**Ranking Factors:**`);
  Object.entries(scores).forEach(([key, value]) => {
    parts.push(`- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toFixed(1)}/100`);
  });

  return parts.join('\n');
}

// ============================================================================
// RETRIEVAL
// ============================================================================

/**
 * Get ranking logs for a user
 */
export async function getUserRankingLogs(
  userId: string,
  logType?: string,
  limit: number = 50
): Promise<RankingLog[]> {
  let query = supabase
    .from('ranking_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (logType) {
    query = query.eq('log_type', logType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch ranking logs:', error);
    return [];
  }

  return (data || []).map(log => ({
    id: log.id,
    userId: log.user_id,
    logType: log.log_type,
    targetId: log.target_id,
    targetType: log.target_type,
    scoreComponents: log.score_components as Record<string, number>,
    totalScore: log.total_score,
    rankingPosition: log.ranking_position,
    explanationText: log.explanation_text,
    factors: log.factors as any,
    searchQuery: log.search_query,
    filtersApplied: log.filters_applied as any,
    createdAt: log.created_at,
  }));
}

/**
 * Get explanation for a specific ranking
 */
export async function getRankingExplanation(logId: string): Promise<RankingLog | null> {
  const { data, error } = await supabase
    .from('ranking_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error || !data) {
    console.error('Failed to fetch ranking explanation:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    logType: data.log_type,
    targetId: data.target_id,
    targetType: data.target_type,
    scoreComponents: data.score_components as Record<string, number>,
    totalScore: data.total_score,
    rankingPosition: data.ranking_position,
    explanationText: data.explanation_text,
    factors: data.factors as any,
    searchQuery: data.search_query,
    filtersApplied: data.filters_applied as any,
    createdAt: data.created_at,
  };
}

/**
 * Get logs for a specific target (e.g., why was this job shown to users?)
 */
export async function getTargetRankingLogs(
  targetId: string,
  limit: number = 50
): Promise<RankingLog[]> {
  const { data, error } = await supabase
    .from('ranking_logs')
    .select('*')
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch target ranking logs:', error);
    return [];
  }

  return (data || []).map(log => ({
    id: log.id,
    userId: log.user_id,
    logType: log.log_type,
    targetId: log.target_id,
    targetType: log.target_type,
    scoreComponents: log.score_components as Record<string, number>,
    totalScore: log.total_score,
    rankingPosition: log.ranking_position,
    explanationText: log.explanation_text,
    factors: log.factors as any,
    searchQuery: log.search_query,
    filtersApplied: log.filters_applied as any,
    createdAt: log.created_at,
  }));
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get ranking statistics for analysis
 */
export async function getRankingStatistics(userId: string) {
  const logs = await getUserRankingLogs(userId, undefined, 1000);

  const stats = {
    totalLogs: logs.length,
    byType: {} as Record<string, number>,
    avgScores: {} as Record<string, number>,
    topFactors: {
      positive: {} as Record<string, number>,
      negative: {} as Record<string, number>,
    },
  };

  logs.forEach(log => {
    // Count by type
    stats.byType[log.logType] = (stats.byType[log.logType] || 0) + 1;

    // Average scores
    Object.entries(log.scoreComponents).forEach(([key, value]) => {
      if (!stats.avgScores[key]) stats.avgScores[key] = 0;
      stats.avgScores[key] += value;
    });

    // Count factors
    log.factors.positive.forEach(factor => {
      const key = factor.split('(')[0].trim(); // Extract main factor
      stats.topFactors.positive[key] = (stats.topFactors.positive[key] || 0) + 1;
    });
    log.factors.negative.forEach(factor => {
      const key = factor.split('(')[0].trim();
      stats.topFactors.negative[key] = (stats.topFactors.negative[key] || 0) + 1;
    });
  });

  // Calculate averages
  Object.keys(stats.avgScores).forEach(key => {
    stats.avgScores[key] = stats.avgScores[key] / logs.length;
  });

  return stats;
}
