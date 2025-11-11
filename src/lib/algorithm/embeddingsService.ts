/**
 * Embeddings Service
 * Handles vector embedding generation for semantic matching
 * 
 * Currently uses mock embeddings for development.
 * For production, integrate OpenAI, Cohere, or other embedding providers.
 */

import { supabase } from '@/integrations/supabase/client';

// Vector dimensions (OpenAI ada-002 and text-embedding-3-small use 1536)
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate mock embedding for development/testing
 * In production, replace with actual API call to OpenAI/Cohere
 */
function generateMockEmbedding(text: string, dimensions = EMBEDDING_DIMENSIONS): number[] {
  if (!text || text.trim().length === 0) {
    // Return zero vector for empty text
    return Array(dimensions).fill(0);
  }

  // Create deterministic hash from text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Seed-based random number generator for deterministic results
  let seed = Math.abs(hash);
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Generate normalized vector
  const vector = Array.from({ length: dimensions }, () => rng() * 2 - 1);
  
  // Normalize to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Production embedding function (currently disabled)
 * Uncomment and configure when ready to use real embeddings
 */
/*
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY 
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Token limit
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw error;
  }
}
*/

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Initialize embeddings for a user profile
 */
export async function initializeUserEmbeddings(userId: string): Promise<void> {
  try {
    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('bio, skills, service_categories')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Prepare text for embeddings
    const skillsText = Array.isArray((profile as any).skills) ? (profile as any).skills.join(', ') : '';
    const bioText = (profile as any).bio || '';
    const categoriesText = Array.isArray((profile as any).service_categories) 
      ? (profile as any).service_categories.join(', ') 
      : '';
    
    const combinedText = `${bioText} ${skillsText} ${categoriesText}`.trim();

    // Generate embeddings (using mock for now)
    const skillsEmbedding = generateMockEmbedding(skillsText);
    const bioEmbedding = generateMockEmbedding(bioText);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store embeddings (table will exist after migrations)
    const { error: upsertError } = await (supabase as any)
      .from('profile_embeddings')
      .upsert({
        user_id: userId,
        skills_embedding: skillsEmbedding,
        bio_embedding: bioEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) throw upsertError;

    console.log(`✓ User embeddings initialized for ${userId}`);
  } catch (error) {
    console.error('Failed to initialize user embeddings:', error);
    throw error;
  }
}

/**
 * Initialize embeddings for a job posting
 */
export async function initializeJobEmbeddings(jobId: string): Promise<void> {
  try {
    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, description, requirements, category')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;
    if (!job) throw new Error('Job not found');

    // Prepare text for embeddings
    const jobData = job as any;
    const requirementsText = Array.isArray(jobData.requirements) 
      ? jobData.requirements.join('. ') 
      : (jobData.requirements || '');
    
    const skillsText = Array.isArray(jobData.skills_required) 
      ? jobData.skills_required.join(', ') 
      : '';
    
    const descriptionText = `${jobData.title}. ${jobData.description || ''}`;
    const combinedText = `${descriptionText} ${requirementsText} ${skillsText} ${jobData.category || ''}`.trim();

    // Generate embeddings
    const requirementsEmbedding = generateMockEmbedding(requirementsText);
    const descriptionEmbedding = generateMockEmbedding(descriptionText);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store embeddings (table will exist after migrations)
    const { error: upsertError } = await (supabase as any)
      .from('job_embeddings')
      .upsert({
        job_id: jobId,
        requirements_embedding: requirementsEmbedding,
        description_embedding: descriptionEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) throw upsertError;

    console.log(`✓ Job embeddings initialized for ${jobId}`);
  } catch (error) {
    console.error('Failed to initialize job embeddings:', error);
    throw error;
  }
}

/**
 * Initialize embeddings for content (videos, posts, portfolios)
 */
export async function initializeContentEmbeddings(
  contentId: string,
  contentType: 'video' | 'post' | 'portfolio'
): Promise<void> {
  try {
    let contentText = '';
    let tagsText = '';

    // Fetch content based on type
    if (contentType === 'video') {
      const { data, error } = await supabase
        .from('videos')
        .select('title, description, tags')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Video not found');

      const videoData = data as any;
      contentText = `${videoData.title || ''}. ${videoData.description || ''}`;
      tagsText = Array.isArray(videoData.tags) ? videoData.tags.join(', ') : '';
    } else if (contentType === 'post') {
      // Add post handling when posts table is implemented
      contentText = 'Post content';
    } else if (contentType === 'portfolio') {
      // Add portfolio handling when needed
      contentText = 'Portfolio item';
    }

    const combinedText = `${contentText} ${tagsText}`.trim();

    // Generate embeddings
    const textEmbedding = generateMockEmbedding(contentText);
    const tagsEmbedding = generateMockEmbedding(tagsText);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store embeddings (table will exist after migrations)
    const { error: upsertError } = await (supabase as any)
      .from('content_embeddings')
      .upsert({
        content_id: contentId,
        content_type: contentType,
        text_embedding: textEmbedding,
        tags_embedding: tagsEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) throw upsertError;

    console.log(`✓ Content embeddings initialized for ${contentId} (${contentType})`);
  } catch (error) {
    console.error('Failed to initialize content embeddings:', error);
    throw error;
  }
}

/**
 * Batch initialize user embeddings for multiple users
 */
export async function batchInitializeUserEmbeddings(userIds: string[]): Promise<void> {
  const results = await Promise.allSettled(
    userIds.map(userId => initializeUserEmbeddings(userId))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`${failed.length} user embeddings failed to initialize`);
  }

  console.log(`✓ Batch initialized ${userIds.length - failed.length}/${userIds.length} user embeddings`);
}

/**
 * Batch initialize job embeddings for multiple jobs
 */
export async function batchInitializeJobEmbeddings(jobIds: string[]): Promise<void> {
  const results = await Promise.allSettled(
    jobIds.map(jobId => initializeJobEmbeddings(jobId))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`${failed.length} job embeddings failed to initialize`);
  }

  console.log(`✓ Batch initialized ${jobIds.length - failed.length}/${jobIds.length} job embeddings`);
}
