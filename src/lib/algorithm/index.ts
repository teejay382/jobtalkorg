/**
 * Jobtolk Algorithm System
 * Main export file for the algorithm module
 */

// Main API
export { JobtolkAPI, useJobtolkAlgorithm } from './api';

// Individual modules
export * from './embeddingsService';
export * from './jtsAlgorithm';
export * from './discoveryFeed';
export * from './rankingLogs';

// Re-export types for convenience
export type {
  JTSComponents,
  JTSWeights,
  JobMatchResult,
  RankingExplanation,
} from './jtsAlgorithm';

export type {
  FeedWeights,
  FeedItem,
  FeedScores,
} from './discoveryFeed';

export type {
  RankingLog,
  ExplanationContext,
} from './rankingLogs';

export type {
  EmbeddingConfig,
} from './embeddingsService';
