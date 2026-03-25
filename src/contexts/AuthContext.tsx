import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'victim' | 'lawyer' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  city?: string;
  preferred_language?: string;
  bar_council_number?: string;
  specialization?: string[];
  university?: string;
  year_of_study?: number;
  languages_spoken?: string[];
  avatar_url?: string;
  accepting_interns?: boolean;
  fee_range_min?: number;
  fee_range_max?: number;
  bio?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  signUp: (email: string, password: string, profile: Omit<UserProfile, 'id' | 'email'>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) { console.error('[Auth] fetchProfile error:', error); return null; }
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as UserRole,
        city: data.city ?? undefined,
        preferred_language: data.preferred_language ?? undefined,
        bar_council_number: data.bar_council_number ?? undefined,
        specialization: data.specialization ?? undefined,
        university: data.university ?? undefined,
        year_of_study: data.year_of_study ?? undefined,
        languages_spoken: data.languages_spoken ?? undefined,
        avatar_url: data.avatar_url ?? undefined,
        accepting_interns: data.accepting_interns ?? undefined,
        fee_range_min: data.fee_range_min ?? undefined,
        fee_range_max: data.fee_range_max ?? undefined,
        bio: data.bio ?? undefined,
      };
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Hard timeout: always render within 4s
    const hardTimeout = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn('[Auth] Hard timeout — forcing render');
        setIsLoading(false);
      }
    }, 4000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        console.log('[Auth] State change:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            if (mountedRef.current) {
              setUser(profile);
              if (profile) setSelectedRole(profile.role);
              setIsLoading(false);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSelectedRole(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // no-op, session already updated
        }
      }
    );

    // THEN check existing session
    const initialize = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mountedRef.current) {
          const profile = await fetchProfile(session.user.id);
          if (mountedRef.current) {
            setUser(profile);
            if (profile) setSelectedRole(profile.role);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (mountedRef.current) {
          clearTimeout(hardTimeout);
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, profile: Omit<UserProfile, 'id' | 'email'>): Promise<boolean> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: profile.full_name, role: profile.role },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({ title: 'This email is already registered. Please sign in.', variant: 'destructive' });
        } else {
          toast({ title: authError.message, variant: 'destructive' });
        }
        return false;
      }

      if (!authData.user) {
        toast({ title: 'Signup failed. Please try again.', variant: 'destructive' });
        return false;
      }

      // Wait for auth session to propagate for RLS
      await new Promise(r => setTimeout(r, 800));

      const profileData = {
        id: authData.user.id,
        email: cleanEmail,
        full_name: profile.full_name,
        role: profile.role,
        city: profile.city || null,
        preferred_language: profile.preferred_language || 'English',
        bar_council_number: profile.bar_council_number || null,
        specialization: profile.specialization || null,
        university: profile.university || null,
        year_of_study: profile.year_of_study || null,
        languages_spoken: profile.languages_spoken || null,
        accepting_interns: profile.accepting_interns || false,
        fee_range_min: profile.fee_range_min || 0,
        fee_range_max: profile.fee_range_max || 0,
        bio: profile.bio || null,
      };

      const { error: insertError } = await supabase.from('users').insert(profileData);
      if (insertError) {
        console.warn('[Auth] Insert failed, trying upsert:', insertError.message);
        const { error: upsertError } = await supabase.from('users').upsert(profileData, { onConflict: 'id' });
        if (upsertError) {
          console.error('[Auth] Profile upsert error:', upsertError);
          toast({ title: 'Account created but profile setup failed. Please contact support.', variant: 'destructive' });
          return false;
        }
      }

      // Set user immediately so navigation works
      if (mountedRef.current) {
        const fullProfile: UserProfile = {
          ...profileData,
          city: profileData.city ?? undefined,
          preferred_language: profileData.preferred_language ?? undefined,
          bar_council_number: profileData.bar_council_number ?? undefined,
          specialization: profileData.specialization ?? undefined,
          university: profileData.university ?? undefined,
          year_of_study: profileData.year_of_study ?? undefined,
          languages_spoken: profileData.languages_spoken ?? undefined,
          avatar_url: undefined,
          accepting_interns: profileData.accepting_interns ?? undefined,
          fee_range_min: profileData.fee_range_min ?? undefined,
          fee_range_max: profileData.fee_range_max ?? undefined,
          bio: profileData.bio ?? undefined,
        } as UserProfile;
        setUser(fullProfile);
        setSelectedRole(fullProfile.role);
      }

      toast({ title: 'Account created successfully!' });
      return true;
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          toast({ title: 'Incorrect email or password.', variant: 'destructive' });
        } else if (msg.includes('email not confirmed')) {
          toast({ title: 'Please verify your email address before signing in.', variant: 'destructive' });
        } else {
          toast({ title: error.message, variant: 'destructive' });
        }
        return false;
      }

      if (!data.user) {
        toast({ title: 'Sign in failed. Please try again.', variant: 'destructive' });
        return false;
      }

      // Fetch profile and set immediately
      const profile = await fetchProfile(data.user.id);
      if (profile && mountedRef.current) {
        setUser(profile);
        setSelectedRole(profile.role);
      } else if (!profile && data.user) {
        // Recovery: build from auth metadata
        const meta = data.user.user_metadata || {};
        const recovered: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          full_name: (meta.full_name as string) || 'User',
          role: ((meta.role as string) || 'victim') as UserRole,
        };
        await supabase.from('users').upsert(recovered as any, { onConflict: 'id' });
        if (mountedRef.current) {
          setUser(recovered);
          setSelectedRole(recovered.role);
        }
      }

      return true;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedRole(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) {
        toast({ title: 'Failed to update profile.', variant: 'destructive' });
        return false;
      }
      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: 'Profile updated.' });
      return true;
    } catch {
      toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await fetchProfile(user.id);
    if (profile) setUser(profile);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      selectedRole,
      setSelectedRole,
      signUp,
      signIn,
      logout,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
