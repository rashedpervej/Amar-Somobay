import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'member' | 'pending';
  avatar_url: string | null;
  bio: string | null;
  profile_completed: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setAuth: (user: User | null, profile: Profile | null) => void;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setAuth: (user, profile) => set({ user, profile, loading: false }),
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Sync to auth metadata if relevant fields are updated
    if (updates.full_name || updates.avatar_url) {
      await supabase.auth.updateUser({
        data: { 
          full_name: updates.full_name,
          avatar_url: updates.avatar_url
        }
      });
    }
    
    // 3. Fetch fresh profile data to ensure state is in sync with DB
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!fetchError && updatedProfile) {
      // Calculate completion status
      const isCompleted = !!updatedProfile.full_name && !!updatedProfile.avatar_url && !!updatedProfile.bio;
      
      if (isCompleted !== updatedProfile.profile_completed) {
        await supabase.from('profiles').update({ profile_completed: isCompleted }).eq('id', user.id);
        updatedProfile.profile_completed = isCompleted;
      }
      
      set({ profile: updatedProfile });
    }
  },
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state
      set({ user: null, profile: null, loading: false });
    }
  },
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Session retrieval error:', error.message);
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('refresh token') || errMsg.includes('refresh_token') || errMsg.includes('token not found') || errMsg.includes('invalid refresh')) {
          // Forcefully clear session if refresh token is gone
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Fallback: clear local storage manually if signer fails
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
          }
        }
        set({ user: null, profile: null, loading: false, initialized: true });
        return;
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        set({ user: session.user, profile, loading: false, initialized: true });
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      const msg = error?.message?.toLowerCase() || '';
      const isRefreshError = msg.includes('refresh token') || msg.includes('refresh_token') || msg.includes('token not found') || msg.includes('invalid refresh');
      
      if (isRefreshError) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
      set({ user: null, profile: null, loading: false, initialized: true });
    }

    // Listener for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const currentProfile = get().profile;
        
        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, loading: false });
          return;
        }

        if (session?.user) {
          if (currentProfile?.id === session.user.id) return;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          set({ user: session.user, profile, loading: false });
        } else {
          if (currentProfile !== null || get().user !== null) {
            set({ user: null, profile: null, loading: false });
          }
        }
      } catch (error: any) {
        console.error('Auth state change handler error:', error);
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('refresh token') || msg.includes('refresh_token') || msg.includes('token not found') || msg.includes('invalid refresh')) {
          set({ user: null, profile: null, loading: false });
        }
      }
    });
  },
}));
