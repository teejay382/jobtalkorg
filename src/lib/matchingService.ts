import { supabase } from '@/integrations/supabase/client';

/**
 * Simplified matching service that works with current database schema
 * Advanced features (ratings, applications, etc.) can be added later
 */

/**
 * Search jobs with filters
 */
export async function searchJobs(filters: {
  query?: string;
  jobType?: string;
  minPay?: number;
  maxPay?: number;
  location?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Apply filters in JavaScript for simplicity and type safety
    let filteredData = data || [];
    
    if (filters.jobType) {
      filteredData = filteredData.filter(job => job.job_type === filters.jobType);
    }
    
    if (filters.location) {
      filteredData = filteredData.filter(job => 
        job.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredData = filteredData.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }
    
    if (filters.minPay && filters.maxPay) {
      filteredData = filteredData.filter(job =>
        (job.budget_min && job.budget_min >= filters.minPay!) &&
        (job.budget_max && job.budget_max <= filters.maxPay!)
      );
    }

    return { data: filteredData, error: null };
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
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Fetch employer separately
    const { data: employerData } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, username, bio')
      .eq('user_id', jobData.employer_id)
      .single();

    return { 
      data: {
        ...jobData,
        employer: employerData
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error getting job details:', error);
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

/**
 * Create a new job posting
 */
export async function createJob(jobData: {
  title: string;
  description: string;
  job_type: string;
  category?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  requirements?: string[];
  video_url?: string;
  deadline?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        employer_id: user.id,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating job:', error);
    return { data: null, error };
  }
}

/**
 * Update a job posting
 */
export async function updateJob(jobId: string, updates: Partial<{
  title: string;
  description: string;
  job_type: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string;
  requirements: string[];
  video_url: string;
  deadline: string;
  status: string;
}>) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating job:', error);
    return { data: null, error };
  }
}

/**
 * Delete a job posting
 */
export async function deleteJob(jobId: string) {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting job:', error);
    return { error };
  }
}
