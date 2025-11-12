import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/debounce';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  job_type: string;
  required_skills?: string[];
  optional_skills?: string[];
  experience_level?: string;
  location_city?: string;
  latitude?: number;
  longitude?: number;
  max_distance_km?: number;
  pay_rate_min?: number;
  pay_rate_max?: number;
  pay_rate_currency?: string;
  pay_rate_type?: string;
  duration_type?: string;
  urgency_level?: string;
  service_categories?: string[];
  status?: string;
  applications_count?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  filled_at?: string;
  // Legacy fields for backwards compatibility
  budget_min?: number;
  budget_max?: number;
  category?: string;
  location?: string;
  video_url?: string;
  requirements?: string[];
  deadline?: string;
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

      // Fuzzy search with multiple conditions - search even with single character
      if (searchFilters.query) {
        const searchTerm = searchFilters.query.toLowerCase().trim();
        const searchConditions: string[] = [];
        
        // Search in title, description, location, and category
        searchConditions.push(`title.ilike.%${searchTerm}%`);
        searchConditions.push(`description.ilike.%${searchTerm}%`);
        searchConditions.push(`location.ilike.%${searchTerm}%`);
        searchConditions.push(`category.ilike.%${searchTerm}%`);
        
        query = query.or(searchConditions.join(','));
      }

      // Apply filters
      if (searchFilters.category) {
        query = query.eq('category', searchFilters.category);
      }

      if (searchFilters.jobType) {
        query = query.eq('job_type', searchFilters.jobType);
      }

      if (searchFilters.budgetMin) {
        query = query.gte('pay_rate_min', searchFilters.budgetMin);
      }

      if (searchFilters.budgetMax) {
        query = query.lte('pay_rate_max', searchFilters.budgetMax);
      }

      if (searchFilters.location) {
        query = query.ilike('location', `%${searchFilters.location}%`);
      }

      // Fetch all matching jobs
      const { data, error } = await query
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform data
      let transformedJobs = (data || []).map(job => ({
        ...job,
        employer: job.employer && typeof job.employer === 'object' && !Array.isArray(job.employer) && 'username' in job.employer
          ? job.employer
          : undefined
      })) as Job[];

      // Client-side fuzzy filtering and ranking
      if (searchFilters.query) {
        const searchTerm = searchFilters.query.toLowerCase().trim();
        const searchWords = searchTerm.split(/\s+/);
        
        transformedJobs = transformedJobs
          .map(job => {
            let score = 0;
            const titleLower = (job.title || '').toLowerCase();
            const descriptionLower = (job.description || '').toLowerCase();
            const locationLower = (job.location || '').toLowerCase();
            const requiredSkills = (job.required_skills || []).map(s => s.toLowerCase());
            const serviceCategories = (job.service_categories || []).map(s => s.toLowerCase());
            
            // Exact title match gets highest score
            if (titleLower === searchTerm) score += 100;
            else if (titleLower.includes(searchTerm)) score += 50;
            
            // Partial word matches in title
            searchWords.forEach(word => {
              if (word.length >= 2) {
                if (titleLower.includes(word)) score += 20;
                if (descriptionLower.includes(word)) score += 5;
                if (locationLower.includes(word)) score += 10;
              }
            });
            
            // Skills fuzzy matching
            requiredSkills.forEach(skill => {
              if (skill === searchTerm) score += 40;
              else if (skill.includes(searchTerm)) score += 30;
              searchWords.forEach(word => {
                if (word.length >= 2 && skill.includes(word)) score += 15;
              });
            });
            
            // Service categories matching
            serviceCategories.forEach(category => {
              if (category === searchTerm) score += 35;
              else if (category.includes(searchTerm)) score += 25;
              searchWords.forEach(word => {
                if (word.length >= 2 && category.includes(word)) score += 12;
              });
            });
            
            return { ...job, _score: score };
          })
          .filter(job => job._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 50);
      }

      setJobs(transformedJobs);
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
        .eq('onboarding_completed', true);

      // Basic search filters - apply at database level for efficiency
      if (searchFilters.query) {
        const searchTerm = searchFilters.query.toLowerCase().trim();
        query = query.or(
          `full_name.ilike.%${searchTerm}%,` +
          `username.ilike.%${searchTerm}%,` +
          `bio.ilike.%${searchTerm}%,` +
          `company_name.ilike.%${searchTerm}%,` +
          `location_city.ilike.%${searchTerm}%`
        );
      }

      // Filter by skills (exact match in array)
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

      // Fetch more results for client-side filtering
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // If error is about unknown columns, show helpful message
        if (error.message?.includes('column') || error.code === '42703') {
          console.error('Database migration required. Please run: supabase db push');
          throw new Error('Please run database migrations to enable local services search');
        }
        throw error;
      }

      // Transform data
      let freelancersWithLimitedVideos = (data || []).map(profile => ({
        ...profile,
        videos: (profile.videos || []).slice(0, 3)
      })) as FreelancerProfile[];

      // Client-side fuzzy filtering and ranking
      if (searchFilters.query) {
        const searchTerm = searchFilters.query.toLowerCase().trim();
        const searchWords = searchTerm.split(/\s+/);
        
        freelancersWithLimitedVideos = freelancersWithLimitedVideos
          .map(freelancer => {
            let score = 0;
            const fullNameLower = (freelancer.full_name || '').toLowerCase();
            const usernameLower = (freelancer.username || '').toLowerCase();
            const bioLower = (freelancer.bio || '').toLowerCase();
            const companyNameLower = (freelancer.company_name || '').toLowerCase();
            const locationLower = (freelancer.location_city || '').toLowerCase();
            const skills = (freelancer.skills || []).map(s => s.toLowerCase());
            const serviceCategories = (freelancer.service_categories || []).map(s => s.toLowerCase());
            
            // Exact name matches get highest priority
            if (fullNameLower === searchTerm || usernameLower === searchTerm) score += 100;
            else if (fullNameLower.includes(searchTerm) || usernameLower.includes(searchTerm)) score += 50;
            
            // Company name match
            if (companyNameLower === searchTerm) score += 80;
            else if (companyNameLower.includes(searchTerm)) score += 40;
            
            // Partial word matches
            searchWords.forEach(word => {
              if (word.length >= 2) {
                if (fullNameLower.includes(word)) score += 25;
                if (usernameLower.includes(word)) score += 20;
                if (companyNameLower.includes(word)) score += 20;
                if (bioLower.includes(word)) score += 5;
                if (locationLower.includes(word)) score += 10;
              }
            });
            
            // Skills fuzzy matching
            skills.forEach(skill => {
              if (skill === searchTerm) score += 50;
              else if (skill.includes(searchTerm)) score += 30;
              searchWords.forEach(word => {
                if (word.length >= 2 && skill.includes(word)) score += 15;
              });
            });
            
            // Service categories fuzzy matching
            serviceCategories.forEach(category => {
              if (category === searchTerm) score += 45;
              else if (category.includes(searchTerm)) score += 25;
              searchWords.forEach(word => {
                if (word.length >= 2 && category.includes(word)) score += 12;
              });
            });
            
            return { ...freelancer, _score: score };
          })
          .filter(freelancer => freelancer._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 50);
      }

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

  // Memoize debounced search functions - reduced delay for real-time feel
  const debouncedSearchJobs = useMemo(
    () => debounce(searchJobs, 150),
    []
  );

  const debouncedSearchFreelancers = useMemo(
    () => debounce(searchFreelancers, 150),
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