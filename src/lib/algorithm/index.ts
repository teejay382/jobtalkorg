/**
 * JobTolk Algorithm System - Public API
 * 
 * Main entry point for the algorithm system.
 * Import algorithm functions from this file in your application.
 * 
 * @example
 * ```typescript
 * import { initializeUserEmbeddings, scoreJobMatch } from '@/lib/algorithm';
 * 
 * // Initialize user embeddings after profile update
 * await initializeUserEmbeddings(userId);
 * 
 * // Calculate job match score
 * const jts = await scoreJobMatch(userId, jobId);
 * console.log(`Total JTS: ${jts.totalJTS}`);
 * ```
 * 
 * @module algorithm
 */

// Export all functions from api
export {
  // Embeddings functions
  initializeUserEmbeddings,
  initializeJobEmbeddings,
  initializeContentEmbeddings,
  batchInitializeUserEmbeddings,
  batchInitializeJobEmbeddings,
  cosineSimilarity,
  
  // JTS scoring functions
  scoreJobMatch,
  getJobMatchScore,
  refreshUserScore,
  batchRefreshUserScores,
  
  // Types
  type JTSComponents,
  type JTSWeights,
} from './api';

// Default export
export { default } from './api';
