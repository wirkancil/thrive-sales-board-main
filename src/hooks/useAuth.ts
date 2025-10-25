import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle sign out or missing session
      if (event === "SIGNED_OUT" || !session) {
        setSession(null);
        setUser(null);
      } else {
        // Keep the user signed in on TOKEN_REFRESHED, SIGNED_IN, USER_UPDATED, etc.
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Get initial session with error handling
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Clear any invalid session data
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get session:", error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Stop auto refresh to avoid aborted refresh requests during navigation/logout
      try {
        supabase.auth.stopAutoRefresh();
      } catch {}

      // Try server/global logout first
      const { error } = await supabase.auth.signOut({ scope: "global" });

      // If the server says the session doesn't exist (common when token expired),
      // clear local auth state and treat as success
      const isSessionNotFound =
        !!error &&
        (error.message?.includes("session_not_found") ||
          error.message?.includes(
            "Session from session_id claim in JWT does not exist"
          ) ||
          /\bsession[_\s]?not[_\s]?found\b/i.test(error.message || "") ||
          (error as any)?.status === 403);

      if (isSessionNotFound) {
        try {
          await supabase.auth.signOut({ scope: "local" }); // ensure local tokens are removed
        } catch {}
        setSession(null);
        setUser(null);
        return { error: null };
      }

      // If there's any other error, still try local logout and clear state
      if (error) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {}
        setSession(null);
        setUser(null);
        return { error: null }; // Treat as success since we cleared local state
      }

      return { error };
    } catch (err) {
      // If anything fails, ensure we clear local state
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {}
      setSession(null);
      setUser(null);
      return { error: null };
    }
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  };

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
};
