/**
 * Jobtolk Algorithm System
 * Main entry point for algorithm services
 */

// Main API exports
export {
  initializeUserEmbeddings,
  initializeJobEmbeddings,
  scoreJobMatch,
  getJobMatchScore,
  refreshUserScore,
  initializeContentEmbeddings,
  initializeSkillsEmbeddings,
  type JTSComponents,
  type JobMatchJTS,
} from './api';

// Embeddings service exports
export {
  generateProfileEmbedding,
  generateJobEmbedding,
  generateContentEmbedding,
  storeSkillEmbedding,
  calculateCosineSimilarity,
} from './embeddingsService';

// JTS service exports
export {
  calculateJTS,
  updateStoredJTS,
  getStoredJTS,
  updateUserJTS,
  type JTSWeights,
} from './jtsService';
