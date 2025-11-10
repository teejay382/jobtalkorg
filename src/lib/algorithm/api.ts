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
  getStoredJTS,
  updateUserJTS,
  type JTSComponents,
  type JobMatchJTS,
} from './jtsService';

// Re-export types
export type { JTSComponents, JobMatchJTS };

/**
 * Initialize embeddings for a new user profile
 */
export async function initializeUserEmbeddings(userId: string): Promise<void> {
  try {
    await generateProfileEmbedding(userId);
    console.log('User embeddings initialized successfully');
  } catch (error) {
    console.error('Failed to initialize user embeddings:', error);
    throw error;
  }
}

/**
 * Initialize embeddings for a new job posting
 */
export async function initializeJobEmbeddings(jobId: string): Promise<void> {
  try {
    await generateJobEmbedding(jobId);
    console.log('Job embeddings initialized successfully');
  } catch (error) {
    console.error('Failed to initialize job embeddings:', error);
    throw error;
  }
}

/**
 * Calculate and store JTS score for a job-user match
 */
export async function scoreJobMatch(userId: string, jobId: string): Promise<JTSComponents> {
  try {
    const jts = await calculateJTS(userId, jobId);
    await updateStoredJTS(userId, jobId);
    return jts;
  } catch (error) {
    console.error('Failed to score job match:', error);
    throw error;
  }
}

/**
 * Get JTS score for a job match (from cache if available)
 */
export async function getJobMatchScore(
  userId: string,
  jobId: string
): Promise<JTSComponents> {
  try {
    // Try to get cached score first
    const cached = await getStoredJTS(userId, jobId);
    if (cached) {
      return cached;
    }

    // Calculate fresh score
    return await calculateJTS(userId, jobId);
  } catch (error) {
    console.error('Failed to get job match score:', error);
    throw error;
  }
}

/**
 * Refresh user's overall JTS score
 */
export async function refreshUserScore(userId: string): Promise<void> {
  try {
    await updateUserJTS(userId);
    console.log('User JTS score refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh user JTS score:', error);
    throw error;
  }
}

/**
 * Initialize content embeddings for discovery feed
 */
export async function initializeContentEmbeddings(
  contentId: string,
  contentType: 'video' | 'post' | 'portfolio'
): Promise<void> {
  try {
    await generateContentEmbedding(contentId, contentType);
    console.log('Content embeddings initialized successfully');
  } catch (error) {
    console.error('Failed to initialize content embeddings:', error);
    throw error;
  }
}

/**
 * Batch initialize embeddings for multiple skills
 */
export async function initializeSkillsEmbeddings(skills: string[]): Promise<void> {
  try {
    await Promise.all(skills.map(skill => storeSkillEmbedding(skill)));
    console.log(`Initialized embeddings for ${skills.length} skills`);
  } catch (error) {
    console.error('Failed to initialize skills embeddings:', error);
    throw error;
  }
}

// Export individual services for advanced usage
export {
  generateProfileEmbedding,
  generateJobEmbedding,
  generateContentEmbedding,
  storeSkillEmbedding,
  calculateJTS,
  updateStoredJTS,
  getStoredJTS,
  updateUserJTS,
};
