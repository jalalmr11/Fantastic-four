import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  // Fetches and verifies user profile using auth.getUser() and profiles.id
  const fetchProfile = useCallback(async (explicitUserId = null) => {
    if (!isSupabaseConfigured()) {
      setProfile(null);
      setIsAdmin(false);
      return null;
    }

    try {
      // 1. Get verified authenticated user from Supabase Auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        return null;
      }

      const authUser = userData.user;
      const targetId = explicitUserId || authUser.id;

      // 2. Query public.profiles using the authenticated user's ID
      // Note: We only select 'id, role' to be completely compatible with any profile table schema
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', targetId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile from database:', profileError.message);
        setProfile(null);
        setIsAdmin(false);
        return null;
      }

      // 3. Verify profile exists, profiles.id === authUser.id, and check role
      if (profileData && profileData.id === authUser.id) {
        const isUserAdmin = profileData.role === 'admin';
        setUser(authUser);
        setProfile(profileData);
        setIsAdmin(isUserAdmin);
        return profileData;
      }

      setProfile(null);
      setIsAdmin(false);
      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
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

    // Get current session and verify authenticated user
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      if (isMounted) setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setUser(null);
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
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { error: signInError };
      }

      if (!authData?.user) {
        return { error: new Error('No user returned from authentication.') };
      }

      // 2. Fetch authenticated profile and verify role
      const userProfile = await fetchProfile(authData.user.id);

      if (!userProfile) {
        return {
          data: authData,
          error: new Error('Account authenticated, but no profile was found in public.profiles for this user ID. Please check your Supabase profiles table.')
        };
      }

      if (userProfile.role !== 'admin') {
        return {
          data: authData,
          profile: userProfile,
          error: new Error('Access denied: Your account is authenticated, but its role in public.profiles is not "admin".')
        };
      }

      setSession(authData.session);
      setUser(authData.user);
      setProfile(userProfile);
      setIsAdmin(true);

      return { data: authData, profile: userProfile };
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
    await fetchProfile();
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
