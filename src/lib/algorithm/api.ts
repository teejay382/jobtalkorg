/**
 * Main API Interface for JobTolk Algorithm System
 * 
 * This is the primary entry point for algorithm functionality.
 * All algorithm features should be accessed through this file.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   initializeUserEmbeddings, 
 *   scoreJobMatch,
 *   refreshUserScore 
 * } from '@/lib/algorithm/api';
 * 
 * // Initialize embeddings for a new user
 * await initializeUserEmbeddings(userId);
 * 
 * // Calculate match score for a user-job pair
 * const jts = await scoreJobMatch(userId, jobId);
 * console.log(`Match score: ${jts.totalJTS}`);
 * 
 * // Refresh user's overall score
 * await refreshUserScore(userId);
 * ```
 */

// Re-export embeddings functions
export {
  initializeUserEmbeddings,
  initializeJobEmbeddings,
  initializeContentEmbeddings,
  batchInitializeUserEmbeddings,
  batchInitializeJobEmbeddings,
  cosineSimilarity,
} from './embeddingsService';

// Re-export JTS scoring functions
export {
  scoreJobMatch,
  getJobMatchScore,
  refreshUserScore,
  batchRefreshUserScores,
} from './jtsService';

// Re-export types
export type { JTSComponents, JTSWeights } from './jtsService';

/**
 * Default export containing all algorithm functions
 * Alternative usage: import algorithmAPI from '@/lib/algorithm/api'
 */
export default {
  // Embeddings
  initializeUserEmbeddings: async (userId: string) => {
    const { initializeUserEmbeddings } = await import('./embeddingsService');
    return initializeUserEmbeddings(userId);
  },
  initializeJobEmbeddings: async (jobId: string) => {
    const { initializeJobEmbeddings } = await import('./embeddingsService');
    return initializeJobEmbeddings(jobId);
  },
  initializeContentEmbeddings: async (
    contentId: string,
    contentType: 'video' | 'post' | 'portfolio'
  ) => {
    const { initializeContentEmbeddings } = await import('./embeddingsService');
    return initializeContentEmbeddings(contentId, contentType);
  },
  
  // JTS Scoring
  scoreJobMatch: async (userId: string, jobId: string) => {
    const { scoreJobMatch } = await import('./jtsService');
    return scoreJobMatch(userId, jobId);
  },
  getJobMatchScore: async (userId: string, jobId: string) => {
    const { getJobMatchScore } = await import('./jtsService');
    return getJobMatchScore(userId, jobId);
  },
  refreshUserScore: async (userId: string) => {
    const { refreshUserScore } = await import('./jtsService');
    return refreshUserScore(userId);
  },
  
  // Batch operations
  batchInitializeUserEmbeddings: async (userIds: string[]) => {
    const { batchInitializeUserEmbeddings } = await import('./embeddingsService');
    return batchInitializeUserEmbeddings(userIds);
  },
  batchInitializeJobEmbeddings: async (jobIds: string[]) => {
    const { batchInitializeJobEmbeddings } = await import('./embeddingsService');
    return batchInitializeJobEmbeddings(jobIds);
  },
  batchRefreshUserScores: async (userIds: string[]) => {
    const { batchRefreshUserScores } = await import('./jtsService');
    return batchRefreshUserScores(userIds);
  },
};
