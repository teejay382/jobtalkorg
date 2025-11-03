import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/debounce';

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
  service_type?: 'remote' | 'local' | null;
  service_categories?: string[];
  location_city?: string;
  latitude?: number;
  longitude?: number;
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
  serviceType?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  skills?: string[];
  serviceCategories?: string[];
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
        .select(`
          *,
          employer:profiles!employer_id(
            username,
            company_name,
            avatar_url
          )
        `);

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

      // Transform data to match Job interface, handling employer relation
      const transformedJobs = (data || []).map(job => ({
        ...job,
        employer: job.employer && typeof job.employer === 'object' && !Array.isArray(job.employer) && 'username' in job.employer
          ? job.employer
          : undefined
      }));

      setJobs(transformedJobs as Job[]);
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
        .select(`
          *,
          videos:videos!videos_user_id_fkey(
            id,
            title,
            thumbnail_url,
            video_url
          )
        `)
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

      // Try to apply advanced filters (may fail if columns don't exist)
      try {
        // Filter by service type (remote/local)
        if (searchFilters.serviceType && (searchFilters.serviceType === 'remote' || searchFilters.serviceType === 'local')) {
          query = query.eq('service_type', searchFilters.serviceType as 'remote' | 'local');
        }

        // Filter by service categories (for local providers)
        if (searchFilters.serviceCategories && searchFilters.serviceCategories.length > 0) {
          query = query.overlaps('service_categories', searchFilters.serviceCategories);
        }

        // Filter by location if specified
        if (searchFilters.location) {
          query = query.ilike('location_city', `%${searchFilters.location}%`);
        }
      } catch (filterError) {
        // Ignore filter errors - columns may not exist yet
        console.warn('Advanced filters not available:', filterError);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If error is about unknown columns, show helpful message
        if (error.message?.includes('column') || error.code === '42703') {
          console.error('Database migration required. Please run: supabase db push');
          throw new Error('Please run database migrations to enable local services search');
        }
        throw error;
      }

      // Limit videos to 3 per freelancer on client side
      const freelancersWithLimitedVideos = (data || []).map(profile => ({
        ...profile,
        videos: (profile.videos || []).slice(0, 3)
      })) as FreelancerProfile[];

      setFreelancers(freelancersWithLimitedVideos);
    } catch (error) {
      console.error('Error searching freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Memoize debounced search functions
  const debouncedSearchJobs = useMemo(
    () => debounce(searchJobs, 300),
    []
  );

  const debouncedSearchFreelancers = useMemo(
    () => debounce(searchFreelancers, 300),
    []
  );

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
    searchJobs: debouncedSearchJobs,
    searchFreelancers: debouncedSearchFreelancers,
    updateFilters,
    clearFilters,
  };
};