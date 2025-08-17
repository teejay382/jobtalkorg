import { supabase } from '@/integrations/supabase/client';

// Safe profile query that excludes email for other users' profiles
export const getProfileForDisplay = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      username,
      full_name,
      bio,
      account_type,
      company_name,
      skills,
      avatar_url,
      onboarding_completed,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .single();

  return { data, error };
};

// Full profile query for authenticated user's own profile
export const getOwnProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
};

// Search profiles by username (excluding email)
export const searchProfiles = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      username,
      full_name,
      bio,
      account_type,
      company_name,
      skills,
      avatar_url,
      created_at,
      updated_at
    `)
    .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
    .eq('onboarding_completed', true);

  return { data, error };
};