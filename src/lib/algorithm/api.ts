/**
 * Jobtolk Algorithm API
 * Client-side interface for algorithm operations
 */

import {
  generateProfileEmbedding,
  generateJobEmbedding,
  generateContentEmbedding,
  storeSkillEmbedding,
} from './embeddingsService';

import {
  calculateJTS,
  updateStoredJTS,
  findJobMatches,
  batchUpdateJTSScores,
} from './jtsAlgorithm';

import {
  generateDiscoveryFeed,
  getDiscoveryFeed,
  cacheDiscoveryFeed,
  getRandomDiscovery,
  getBlendedFeed,
} from './discoveryFeed';

import {
  logJobMatch,
  logFeedRanking,
  logSearchResult,
  getUserRankingLogs,
  getRankingExplanation,
  getRankingStatistics,
} from './rankingLogs';

// ============================================================================
// EMBEDDINGS API
// ============================================================================

export const EmbeddingsAPI = {
  /**
   * Generate and store profile embedding
   */
  async generateProfile(userId: string): Promise<void> {
    return generateProfileEmbedding(userId);
  },

  /**
   * Generate and store job embedding
   */
  async generateJob(jobId: string): Promise<void> {
    return generateJobEmbedding(jobId);
  },

  /**
   * Generate and store content embedding
   */
  async generateContent(
    contentId: string,
    contentType: 'video' | 'post' | 'portfolio'
  ): Promise<void> {
    return generateContentEmbedding(contentId, contentType);
  },

  /**
   * Store skill embedding for future reuse
   */
  async storeSkill(skill: string): Promise<void> {
    return storeSkillEmbedding(skill);
  },
};

// ============================================================================
// JTS SCORING API
// ============================================================================

export const JTScoringAPI = {
  /**
   * Calculate JTS score for a user
   */
  async calculate(
    userId: string,
    jobId?: string,
    requiredSkills?: string[]
  ) {
    return calculateJTS(userId, jobId, requiredSkills);
  },

  /**
   * Update and store JTS score
   */
  async update(userId: string): Promise<void> {
    return updateStoredJTS(userId);
  },

  /**
   * Find best job matches
   */
  async findMatches(jobId: string, limit?: number) {
    return findJobMatches(jobId, limit);
  },

  /**
   * Batch update JTS scores
   */
  async batchUpdate(limit?: number): Promise<void> {
    return batchUpdateJTSScores(limit);
  },
};

// ============================================================================
// DISCOVERY FEED API
// ============================================================================

export const FeedAPI = {
  /**
   * Generate personalized discovery feed
   */
  async generate(userId: string, limit?: number, offset?: number) {
    return generateDiscoveryFeed(userId, limit, offset);
  },

  /**
   * Get discovery feed (cached or fresh)
   */
  async get(userId: string, limit?: number, offset?: number) {
    return getDiscoveryFeed(userId, limit, offset);
  },

  /**
   * Cache feed for user
   */
  async cache(userId: string): Promise<void> {
    return cacheDiscoveryFeed(userId);
  },

  /**
   * Get random discovery content
   */
  async random(limit?: number) {
    return getRandomDiscovery(limit);
  },

  /**
   * Get blended local/global feed
   */
  async blended(userId: string, limit?: number) {
    return getBlendedFeed(userId, limit);
  },
};

// ============================================================================
// RANKING LOGS API
// ============================================================================

export const RankingLogsAPI = {
  /**
   * Log a job match ranking
   */
  async logJobMatch(
    userId: string,
    jobId: string,
    jtsScores: any,
    locationScore: number,
    embeddingSimilarity: number,
    rankingPosition: number
  ): Promise<string> {
    return logJobMatch(
      userId,
      jobId,
      jtsScores,
      locationScore,
      embeddingSimilarity,
      rankingPosition
    );
  },

  /**
   * Log a feed ranking
   */
  async logFeed(
    userId: string,
    contentId: string,
    contentType: string,
    scores: any,
    rankingPosition: number,
    isLocal: boolean,
    isTrending: boolean
  ): Promise<string> {
    return logFeedRanking(
      userId,
      contentId,
      contentType,
      scores,
      rankingPosition,
      isLocal,
      isTrending
    );
  },

  /**
   * Log a search result
   */
  async logSearch(
    userId: string,
    targetId: string,
    targetType: string,
    searchQuery: string,
    scores: Record<string, number>,
    rankingPosition: number,
    filtersApplied?: Record<string, any>
  ): Promise<string> {
    return logSearchResult(
      userId,
      targetId,
      targetType,
      searchQuery,
      scores,
      rankingPosition,
      filtersApplied
    );
  },

  /**
   * Get user's ranking logs
   */
  async getUserLogs(userId: string, logType?: string, limit?: number) {
    return getUserRankingLogs(userId, logType, limit);
  },

  /**
   * Get explanation for specific ranking
   */
  async getExplanation(logId: string) {
    return getRankingExplanation(logId);
  },

  /**
   * Get ranking statistics
   */
  async getStatistics(userId: string) {
    return getRankingStatistics(userId);
  },
};

// ============================================================================
// COMBINED API
// ============================================================================

/**
 * Main Jobtolk Algorithm API
 */
export const JobtolkAPI = {
  embeddings: EmbeddingsAPI,
  scoring: JTScoringAPI,
  feed: FeedAPI,
  logs: RankingLogsAPI,

  /**
   * Initialize algorithm for a new user
   */
  async initializeUser(userId: string): Promise<void> {
    try {
      // Generate profile embedding
      await EmbeddingsAPI.generateProfile(userId);

      // Calculate initial JTS score
      await JTScoringAPI.update(userId);

      // Generate initial feed cache
      await FeedAPI.cache(userId);

      console.log(`Algorithm initialized for user ${userId}`);
    } catch (error) {
      console.error('Failed to initialize user algorithm:', error);
      throw error;
    }
  },

  /**
   * Initialize algorithm for a new job
   */
  async initializeJob(jobId: string): Promise<void> {
    try {
      // Generate job embedding
      await EmbeddingsAPI.generateJob(jobId);

      console.log(`Algorithm initialized for job ${jobId}`);
    } catch (error) {
      console.error('Failed to initialize job algorithm:', error);
      throw error;
    }
  },

  /**
   * Process new content upload
   */
  async processContent(
    contentId: string,
    contentType: 'video' | 'post' | 'portfolio',
    userId: string
  ): Promise<void> {
    try {
      // Generate content embedding
      await EmbeddingsAPI.generateContent(contentId, contentType);

      // Update user JTS (due to new activity)
      await JTScoringAPI.update(userId);

      console.log(`Content ${contentId} processed`);
    } catch (error) {
      console.error('Failed to process content:', error);
      throw error;
    }
  },

  /**
   * Get job recommendations for a user
   */
  async getJobRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    // This would query jobs and rank them by JTS
    // Implementation depends on your job discovery flow
    return [];
  },

  /**
   * Search with algorithm ranking
   */
  async search(
    userId: string,
    query: string,
    filters?: Record<string, any>
  ): Promise<any[]> {
    // Implement search with JTS-based ranking
    // Would integrate with your existing search functionality
    return [];
  },
};

// ============================================================================
// HOOKS (for React)
// ============================================================================

/**
 * React hook for using Jobtolk Algorithm
 */
export function useJobtolkAlgorithm() {
  return {
    embeddings: EmbeddingsAPI,
    scoring: JTScoringAPI,
    feed: FeedAPI,
    logs: RankingLogsAPI,
    api: JobtolkAPI,
  };
}
