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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch with setTimeout to prevent auth deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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

          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .upsert(upsertPayload, { onConflict: 'user_id' })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            setProfile(null);
            return;
          }

          setProfile(created as unknown as Profile);
          return;
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