import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  // Keep both `role` and legacy `account_type` to remain compatible with DB and UI.
  // Accept broader string|null from the DB and normalize elsewhere when needed.
  role: 'freelancer' | 'employer' | string | null;
  account_type: 'freelancer' | 'employer' | string | null;
  company_name: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  // optional extended fields
  location?: string | null;
  portfolio?: string | null;
  available?: boolean | null;
  company_logo?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session (this will automatically handle OAuth callbacks from URL)
    const initializeAuth = async () => {
      try {
        // Clear any invalid tokens first
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            // Check if token is expired or invalid
            if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
              localStorage.removeItem('supabase.auth.token');
            }
          } catch (e) {
            // Invalid token format, clear it
            localStorage.removeItem('supabase.auth.token');
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Clear invalid session data
          localStorage.removeItem('supabase.auth.token');
          console.error('Error getting session:', error);
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Clean up URL if it contains auth tokens
            if (window.location.hash && window.location.hash.includes('access_token')) {
              // Clear the URL hash to remove tokens from address bar
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            // Fetch profile after a short delay to ensure auth is settled
            setTimeout(() => {
              if (mounted) {
                fetchProfile(session.user.id);
              }
            }, 100);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Clean up URL if it contains auth tokens
          if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Fetch profile for newly signed in user
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        } else if (session?.user) {
          // For existing sessions, fetch profile
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 100);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Initialize auth state
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile exists yet - create a minimal one
          const authUser = (await supabase.auth.getUser()).data.user;
          if (!authUser) {
            setProfile(null);
            return;
          }

          const username = (authUser.user_metadata && (authUser.user_metadata.user_name || authUser.user_metadata.full_name)) || (authUser.email ? authUser.email.split('@')[0] : null);

          const upsertPayload = {
            user_id: authUser.id,
            email: authUser.email || '',
            full_name: (authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) || null,
            username: username,
            onboarding_completed: false,
          } as unknown as Database['public']['Tables']['profiles']['Insert'];

          // Try upsert; if the remote DB rejects due to missing columns (e.g. role),
          // retry with a trimmed payload.
          try {
            const { data: created, error: insertError } = await supabase
              .from('profiles')
              .upsert(upsertPayload, { onConflict: 'user_id' })
              .select()
              .single();

            if (insertError) {
              // If the insert failed due to schema mismatch, try a fallback
              console.warn('Initial profile upsert failed, attempting fallback upsert:', insertError);
              const fallback = { user_id: authUser.id, email: authUser.email || '', onboarding_completed: false } as unknown as Database['public']['Tables']['profiles']['Insert'];
              const { data: created2, error: insertError2 } = await supabase
                .from('profiles')
                .upsert(fallback, { onConflict: 'user_id' })
                .select()
                .single();

              if (insertError2) {
                console.error('Error creating profile (fallback):', insertError2);
                setProfile(null);
                return;
              }

              setProfile(created2 as unknown as Profile);
              return;
            }

            setProfile(created as unknown as Profile);
            return;
          } catch (e) {
            console.error('Unexpected error during profile upsert:', e);
            setProfile(null);
            return;
          }
        } else {
          console.error('Error fetching profile:', error);
          return;
        }
      }

  setProfile(data);

      // Enrich missing display fields from auth metadata if needed
      const authUser = (await supabase.auth.getUser()).data.user;
      if (authUser && data) {
        const meta = authUser.user_metadata || {};
        const emailPrefix = authUser.email ? authUser.email.split('@')[0] : null;
        const suggestedFull = data.full_name || meta.full_name || meta.name || null;
        const suggestedUsername = data.username || meta.user_name || suggestedFull || emailPrefix || null;
        if ((!data.full_name && suggestedFull) || (!data.username && suggestedUsername)) {
          try {
            const updatePayload = {
              full_name: data.full_name || suggestedFull,
              username: data.username || suggestedUsername,
            } as unknown as Database['public']['Tables']['profiles']['Update'];

            const { data: updated } = await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('user_id', authUser.id)
              .select()
              .single();
            if (updated) setProfile(updated as unknown as Profile);
          } catch (e) {
            // ignore enrichment errors
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ data: Profile | null; error: unknown }> => {
    if (!user) return { data: null, error: 'No user logged in' };

    try {
      const dbUpdates = updates as unknown as Database['public']['Tables']['profiles']['Update'];
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      return { data: data as Profile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    refetchProfile: () => user && fetchProfile(user.id)
  };
};

// Utility to normalize role from profile object
export const getProfileRole = (profile: Profile | null | undefined): 'freelancer' | 'employer' | undefined => {
  if (!profile) return undefined;
  const roleVal = (profile.role as string) || (profile.account_type as string) || undefined;
  if (roleVal === 'freelancer') return 'freelancer';
  if (roleVal === 'employer') return 'employer';
  return undefined;
};