import { supabase } from '@/integrations/supabase/client';

export interface JobMatch {
  job_id: string;
  title: string;
  description: string;
  job_type: string;
  required_skills: string[];
  location_city: string | null;
  pay_rate_min: number | null;
  pay_rate_max: number | null;
  urgency_level: string | null;
  employer_name: string | null;
  created_at: string;
  skill_score: number;
  location_score: number;
  total_score: number;
}

export interface TalentMatch {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  location_city: string | null;
  avg_rating: number;
  skill_score: number;
  location_score: number;
  reputation_score: number;
  total_score: number;
}

/**
 * Find matching jobs for a user
 */
export async function findMatchesForUser(
  userId: string,
  limit: number = 50
): Promise<{ data: JobMatch[] | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('find_matches_for_user', {
      p_user_id: userId,
      p_limit: limit
    });

    if (error) throw error;
    return { data: data as JobMatch[], error: null };
  } catch (error) {
    console.error('Error finding job matches:', error);
    return { data: null, error };
  }
}

/**
 * Find matching talent for a job
 */
export async function findMatchesForJob(
  jobId: string,
  limit: number = 50
): Promise<{ data: TalentMatch[] | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('find_matches_for_job', {
      p_job_id: jobId,
      p_limit: limit
    });

    if (error) throw error;
    return { data: data as TalentMatch[], error: null };
  } catch (error) {
    console.error('Error finding talent matches:', error);
    return { data: null, error };
  }
}

/**
 * Track user interaction for learning
 */
export async function trackInteraction(
  userId: string,
  targetType: 'job' | 'profile' | 'video',
  targetId: string,
  interactionType: 'view' | 'click' | 'apply' | 'save' | 'contact' | 'hire' | 'accept',
  source?: string,
  metadata?: Record<string, any>
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from('user_interactions').insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
      interaction_type: interactionType,
      source: source || 'unknown',
      metadata: metadata || null
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return { error };
  }
}

/**
 * Apply to a job
 */
export async function applyToJob(
  jobId: string,
  applicantId: string,
  coverLetter?: string,
  proposedRate?: number
): Promise<{ data: any; error: any }> {
  try {
    // Create application
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_id: applicantId,
        cover_letter: coverLetter || null,
        proposed_rate: proposedRate || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Track the interaction
    await trackInteraction(applicantId, 'job', jobId, 'apply', 'job_matches');

    // Increment application count
    await supabase.rpc('increment', {
      table_name: 'jobs',
      row_id: jobId,
      column_name: 'applications_count'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error applying to job:', error);
    return { data: null, error };
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No stats exist, create initial record
      const { data: newStats, error: insertError } = await supabase
        .from('user_statistics')
        .insert({
          user_id: userId,
          profile_completeness_score: 0,
          trust_score: 50,
          avg_rating: 0,
          total_ratings: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data: newStats, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return { data: null, error };
  }
}

/**
 * Submit a rating
 */
export async function submitRating(
  jobId: string | null,
  ratedUserId: string,
  raterUserId: string,
  rating: number,
  reviewText?: string,
  communicationRating?: number,
  qualityRating?: number
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        job_id: jobId,
        rated_user_id: ratedUserId,
        rater_user_id: raterUserId,
        rating,
        review_text: reviewText || null,
        communication_rating: communicationRating || null,
        quality_rating: qualityRating || null
      })
      .select()
      .single();

    if (error) throw error;

    // Update user statistics
    await updateUserRatingStats(ratedUserId);

    return { data, error: null };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { data: null, error };
  }
}

/**
 * Update user rating statistics
 */
async function updateUserRatingStats(userId: string) {
  try {
    // Calculate new averages
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user_id', userId);

    if (!ratings || ratings.length === 0) return;

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const totalRatings = ratings.length;

    // Update statistics
    await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        avg_rating: avgRating,
        total_ratings: totalRatings,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error updating rating stats:', error);
  }
}

/**
 * Search jobs with filters
 */
export async function searchJobs(filters: {
  query?: string;
  jobType?: string;
  skills?: string[];
  minPay?: number;
  maxPay?: number;
  urgencyLevel?: string;
  location?: string;
}) {
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(full_name, avatar_url, username)
      `)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString());

    // Apply filters
    if (filters.jobType) {
      query = query.eq('job_type', filters.jobType);
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps('required_skills', filters.skills);
    }

    if (filters.minPay) {
      query = query.gte('pay_rate_min', filters.minPay);
    }

    if (filters.maxPay) {
      query = query.lte('pay_rate_max', filters.maxPay);
    }

    if (filters.urgencyLevel) {
      query = query.eq('urgency_level', filters.urgencyLevel);
    }

    if (filters.location) {
      query = query.ilike('location_city', `%${filters.location}%`);
    }

    // Text search on title and description
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching jobs:', error);
    return { data: null, error };
  }
}

/**
 * Get job details
 */
export async function getJobDetails(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(
          user_id,
          full_name,
          avatar_url,
          username,
          bio
        ),
        applications:job_applications(count)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting job details:', error);
    return { data: null, error };
  }
}

/**
 * Get user's applications
 */
export async function getUserApplications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:jobs(
          id,
          title,
          description,
          job_type,
          pay_rate_min,
          pay_rate_max,
          status,
          employer:profiles!employer_id(full_name, avatar_url)
        )
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting applications:', error);
    return { data: null, error };
  }
}

/**
 * Get jobs posted by employer
 */
export async function getEmployerJobs(employerId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting employer jobs:', error);
    return { data: null, error };
  }
}
