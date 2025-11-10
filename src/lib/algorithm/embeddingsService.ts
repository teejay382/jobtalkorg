/**
 * Embeddings Service
 * Handles vector embeddings generation for semantic matching
 */

import { supabase } from '@/integrations/supabase/client';

// Note: In production, you would use OpenAI's API or similar service
// For now, we'll create placeholder embeddings

/**
 * Generate a mock embedding vector (1536 dimensions for OpenAI ada-002 compatibility)
 * In production, replace this with actual API calls to OpenAI or similar
 */
function generateMockEmbedding(text: string): number[] {
  // Create a deterministic but random-looking embedding based on text
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding: number[] = [];
  
  for (let i = 0; i < 1536; i++) {
    // Use a simple pseudo-random function based on seed and index
    const value = Math.sin(seed * (i + 1)) * 10000;
    embedding.push((value - Math.floor(value)) * 2 - 1); // Normalize to [-1, 1]
  }
  
  return embedding;
}

/**
 * Generate profile embedding from user skills and bio
 */
export async function generateProfileEmbedding(userId: string): Promise<void> {
  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('skills, bio, full_name, service_categories')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Combine text for embedding
    const skillsText = (profile.skills || []).join(' ');
    const bioText = profile.bio || '';
    const categoriesText = (profile.service_categories || []).join(' ');
    const combinedText = `${profile.full_name} ${skillsText} ${bioText} ${categoriesText}`.trim();

    // Generate embeddings (mock for now)
    const skillsEmbedding = generateMockEmbedding(skillsText);
    const bioEmbedding = generateMockEmbedding(bioText);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store in database
    const { error: insertError } = await supabase
      .from('profile_embeddings')
      .upsert({
        user_id: userId,
        skills_embedding: skillsEmbedding,
        bio_embedding: bioEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error generating profile embedding:', error);
    throw error;
  }
}

/**
 * Generate job embedding from requirements and description
 */
export async function generateJobEmbedding(jobId: string): Promise<void> {
  try {
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, description, required_skills, service_categories')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Combine text for embedding
    const requirementsText = (job.required_skills || []).join(' ');
    const descriptionText = `${job.title} ${job.description}`.trim();
    const categoriesText = (job.service_categories || []).join(' ');
    const combinedText = `${descriptionText} ${requirementsText} ${categoriesText}`.trim();

    // Generate embeddings (mock for now)
    const requirementsEmbedding = generateMockEmbedding(requirementsText);
    const descriptionEmbedding = generateMockEmbedding(descriptionText);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store in database
    const { error: insertError } = await supabase
      .from('job_embeddings')
      .upsert({
        job_id: jobId,
        requirements_embedding: requirementsEmbedding,
        description_embedding: descriptionEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error generating job embedding:', error);
    throw error;
  }
}

/**
 * Generate content embedding for videos/posts
 */
export async function generateContentEmbedding(
  contentId: string,
  contentType: 'video' | 'post' | 'portfolio'
): Promise<void> {
  try {
    let textContent = '';
    let tagsContent = '';

    if (contentType === 'video') {
      const { data: video, error } = await supabase
        .from('videos')
        .select('title, description, tags')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      textContent = `${video.title} ${video.description || ''}`.trim();
      tagsContent = (video.tags || []).join(' ');
    }

    const combinedText = `${textContent} ${tagsContent}`.trim();

    // Generate embeddings (mock for now)
    const textEmbedding = generateMockEmbedding(textContent);
    const tagsEmbedding = generateMockEmbedding(tagsContent);
    const combinedEmbedding = generateMockEmbedding(combinedText);

    // Store in database
    const { error: insertError } = await supabase
      .from('content_embeddings')
      .upsert({
        content_id: contentId,
        content_type: contentType,
        text_embedding: textEmbedding,
        tags_embedding: tagsEmbedding,
        combined_embedding: combinedEmbedding,
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error generating content embedding:', error);
    throw error;
  }
}

/**
 * Store individual skill embedding
 */
export async function storeSkillEmbedding(skillText: string): Promise<void> {
  try {
    const embedding = generateMockEmbedding(skillText);

    const { error } = await supabase
      .from('skill_embeddings')
      .upsert({
        skill_text: skillText.toLowerCase(),
        embedding: embedding,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing skill embedding:', error);
    throw error;
  }
}

/**
 * Calculate similarity between two embeddings
 */
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}
