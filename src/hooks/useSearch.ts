import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  category?: string;
  job_type: string;
  location?: string;
  video_url?: string;
  requirements?: string[];
  deadline?: string;
  created_at: string;
  employer?: {
    username: string;
    company_name?: string;
    avatar_url?: string;
  };
}

export interface FreelancerProfile {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  account_type: string;
  company_name?: string;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail_url?: string;
    video_url: string;
  }>;
}

export interface SearchFilters {
  query: string;
  category?: string;
  jobType?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  skills?: string[];
}

export const useSearch = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
  });

  const searchJobs = async (searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select('*');

      // Full-text search
      if (searchFilters.query) {
        query = query.or(
          `title.ilike.%${searchFilters.query}%,description.ilike.%${searchFilters.query}%`
        );
      }

      // Apply filters
      if (searchFilters.category) {
        query = query.eq('category', searchFilters.category);
      }

      if (searchFilters.jobType) {
        query = query.eq('job_type', searchFilters.jobType);
      }

      if (searchFilters.budgetMin) {
        query = query.gte('budget_min', searchFilters.budgetMin);
      }

      if (searchFilters.budgetMax) {
        query = query.lte('budget_max', searchFilters.budgetMax);
      }

      if (searchFilters.location) {
        query = query.ilike('location', `%${searchFilters.location}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch employer profiles separately
      const jobsWithEmployers = await Promise.all(
        (data || []).map(async (job) => {
          const { data: employer } = await supabase
            .from('profiles')
            .select('username, company_name, avatar_url')
            .eq('user_id', job.employer_id)
            .single();

          return {
            ...job,
            employer
          } as Job;
        })
      );

      setJobs(jobsWithEmployers);
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const searchFreelancers = async (searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'freelancer');

      // Search in name, bio, skills
      if (searchFilters.query) {
        query = query.or(
          `full_name.ilike.%${searchFilters.query}%,` +
          `username.ilike.%${searchFilters.query}%,` +
          `bio.ilike.%${searchFilters.query}%`
        );
      }

      // Filter by skills
      if (searchFilters.skills && searchFilters.skills.length > 0) {
        query = query.overlaps('skills', searchFilters.skills);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch videos separately
      const freelancersWithVideos = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: videos } = await supabase
            .from('videos')
            .select('id, title, thumbnail_url, video_url')
            .eq('user_id', profile.user_id)
            .limit(3);

          return {
            ...profile,
            videos: videos || []
          } as FreelancerProfile;
        })
      );

      setFreelancers(freelancersWithVideos);
    } catch (error) {
      console.error('Error searching freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({ query: '' });
    setJobs([]);
    setFreelancers([]);
  };

  return {
    jobs,
    freelancers,
    loading,
    filters,
    searchJobs,
    searchFreelancers,
    updateFilters,
    clearFilters,
  };
};