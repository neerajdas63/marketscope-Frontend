import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseConfigurationError, getSupabaseGoogleRedirectUrl, isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  configError: string | null;
  signInPending: boolean;
  signOutPending: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signInPending, setSignInPending] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
      setSignInPending(false);
      setSignOutPending(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: getSupabaseConfigurationError() };
    }

    setSignInPending(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getSupabaseGoogleRedirectUrl(),
      },
    });

    if (error) {
      setSignInPending(false);
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    setSignOutPending(true);
    await supabase.auth.signOut();
    setSignOutPending(false);
  };

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
    isConfigured: isSupabaseConfigured,
    isLoading,
    configError: getSupabaseConfigurationError(),
    signInPending,
    signOutPending,
    signInWithGoogle,
    signOut,
  }), [session, isLoading, signInPending, signOutPending]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}