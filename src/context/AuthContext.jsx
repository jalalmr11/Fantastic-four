import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured()) {
      setProfile(null);
      setIsAdmin(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        setProfile(null);
        setIsAdmin(false);
        return null;
      }

      setProfile(data);
      setIsAdmin(data?.role === 'admin');
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
      setIsAdmin(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured. Please add your credentials to .env.local') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        const userProfile = await fetchProfile(data.user.id);
        return { data, profile: userProfile };
      }

      return { data };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
