/**
 * Embeddings Service
 * Handles generation and caching of vector embeddings using OpenAI API
 */

import { supabase } from '@/integrations/supabase/client';

export interface EmbeddingConfig {
  apiKey: string;
  model: string;
  dimensions: number;
}

// Default configuration for OpenAI text-embedding-ada-002
const DEFAULT_CONFIG: EmbeddingConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'text-embedding-ada-002',
  dimensions: 1536,
};

/**
 * Generate embedding vector for text using OpenAI API
 */
export async function generateEmbedding(
  text: string,
  config: Partial<EmbeddingConfig> = {}
): Promise<number[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalConfig.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: finalConfig.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate and store skill embedding
 */
export async function storeSkillEmbedding(skill: string): Promise<void> {
  // Check if already exists
  const { data: existing } = await supabase
    .from('skill_embeddings')
    .select('id')
    .eq('skill_text', skill.toLowerCase())
    .single();

  if (existing) return; // Already cached

  const embedding = await generateEmbedding(skill);

  await supabase.from('skill_embeddings').insert({
    skill_text: skill.toLowerCase(),
    embedding: JSON.stringify(embedding),
  });
}

/**
 * Generate and store profile embeddings
 */
export async function generateProfileEmbedding(userId: string): Promise<void> {
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, service_categories, bio, full_name')
    .eq('user_id', userId)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Create text representations
  const skillsText = [
    ...(profile.skills || []),
    ...(profile.service_categories || []),
  ].join(', ');

  const bioText = profile.bio || `${profile.full_name} profile`;

  // Generate embeddings
  const [skillsEmbedding, bioEmbedding] = await Promise.all([
    generateEmbedding(skillsText || 'general freelancer'),
    generateEmbedding(bioText),
  ]);

  // Create combined embedding (weighted average)
  const combinedEmbedding = skillsEmbedding.map((val, idx) => 
    val * 0.7 + bioEmbedding[idx] * 0.3
  );

  // Store in database
  await supabase
    .from('profile_embeddings')
    .upsert({
      user_id: userId,
      skills_embedding: JSON.stringify(skillsEmbedding),
      bio_embedding: JSON.stringify(bioEmbedding),
      combined_embedding: JSON.stringify(combinedEmbedding),
      updated_at: new Date().toISOString(),
    });
}

/**
 * Generate and store job embeddings
 */
export async function generateJobEmbedding(jobId: string): Promise<void> {
  // Get job data
  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, required_skills, optional_skills')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  // Create text representations
  const requirementsText = [
    job.title,
    ...(job.required_skills || []),
    ...(job.optional_skills || []),
  ].join(', ');

  const descriptionText = job.description;

  // Generate embeddings
  const [requirementsEmbedding, descriptionEmbedding] = await Promise.all([
    generateEmbedding(requirementsText),
    generateEmbedding(descriptionText),
  ]);

  // Create combined embedding (weighted average)
  const combinedEmbedding = requirementsEmbedding.map((val, idx) => 
    val * 0.6 + descriptionEmbedding[idx] * 0.4
  );

  // Store in database
  await supabase
    .from('job_embeddings')
    .upsert({
      job_id: jobId,
      requirements_embedding: JSON.stringify(requirementsEmbedding),
      description_embedding: JSON.stringify(descriptionEmbedding),
      combined_embedding: JSON.stringify(combinedEmbedding),
      updated_at: new Date().toISOString(),
    });
}

/**
 * Generate and store content embeddings (for videos/posts)
 */
export async function generateContentEmbedding(
  contentId: string,
  contentType: 'video' | 'post' | 'portfolio'
): Promise<void> {
  let textContent = '';
  let tags: string[] = [];

  // Get content data based on type
  if (contentType === 'video') {
    const { data: video } = await supabase
      .from('videos')
      .select('title, description, tags')
      .eq('id', contentId)
      .single();

    if (video) {
      textContent = `${video.title} ${video.description || ''}`;
      tags = video.tags || [];
    }
  }

  if (!textContent) {
    textContent = 'content';
  }

  // Generate embeddings
  const tagsText = tags.join(', ') || 'general';
  const [textEmbedding, tagsEmbedding] = await Promise.all([
    generateEmbedding(textContent),
    generateEmbedding(tagsText),
  ]);

  // Create combined embedding
  const combinedEmbedding = textEmbedding.map((val, idx) => 
    val * 0.7 + tagsEmbedding[idx] * 0.3
  );

  // Store in database
  await supabase
    .from('content_embeddings')
    .upsert({
      content_id: contentId,
      content_type: contentType,
      text_embedding: JSON.stringify(textEmbedding),
      tags_embedding: JSON.stringify(tagsEmbedding),
      combined_embedding: JSON.stringify(combinedEmbedding),
      updated_at: new Date().toISOString(),
    });
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar profiles using vector search
 */
export async function findSimilarProfiles(
  userId: string,
  limit: number = 10
): Promise<Array<{ user_id: string; similarity: number }>> {
  const { data: userEmbedding } = await supabase
    .from('profile_embeddings')
    .select('combined_embedding')
    .eq('user_id', userId)
    .single();

  if (!userEmbedding) return [];

  // Use pgvector similarity search
  const { data: similar } = await supabase.rpc('match_profiles', {
    query_embedding: userEmbedding.combined_embedding,
    match_threshold: 0.5,
    match_count: limit,
  });

  return similar || [];
}

/**
 * Batch generate embeddings for multiple items
 */
export async function batchGenerateEmbeddings(
  items: Array<{ id: string; type: 'profile' | 'job' | 'content' }>
): Promise<void> {
  const promises = items.map((item) => {
    switch (item.type) {
      case 'profile':
        return generateProfileEmbedding(item.id);
      case 'job':
        return generateJobEmbedding(item.id);
      case 'content':
        return generateContentEmbedding(item.id, 'video');
      default:
        return Promise.resolve();
    }
  });

  await Promise.all(promises);
}

/**
 * Alternative: Use Hugging Face for embeddings (free, open-source)
 */
export async function generateEmbeddingHuggingFace(text: string): Promise<number[]> {
  // Using Hugging Face Inference API
  // Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const embedding = await response.json();
    return embedding;
  } catch (error) {
    console.error('Error generating Hugging Face embedding:', error);
    throw error;
  }
}
