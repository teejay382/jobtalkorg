import { supabase } from '@/integrations/supabase/client';

// Safe profile query that excludes email for other users' profiles
export const getPublicProfile = async (userId: string) => {
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
  // Prefer an explicit select to avoid schema/cache issues. Try including
  // `role` where available; if the remote DB doesn't have it, fall back
  // to selecting the legacy `account_type` and common fields.
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        username,
        full_name,
        bio,
        role,
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

    if (error) {
      // If the error indicates a missing column (e.g. role), fall back below.
      console.warn('getOwnProfile select including role failed, falling back:', error);
      throw error;
    }

    return { data, error: null };
  } catch (err: any) {
    // Fallback: select without `role` to support older schemas.
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
  }
};

// Search profiles by username (excluding email for security)
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

// Helper function to get all public profiles (for admin/moderation use only)
export const getAllPublicProfiles = async () => {
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
    .eq('onboarding_completed', true)
    .order('created_at', { ascending: false });

  return { data, error };
};