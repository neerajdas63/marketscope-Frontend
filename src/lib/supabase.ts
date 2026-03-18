import { createClient } from "@supabase/supabase-js";

import { APP_ROUTE } from "@/lib/authRoutes";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function getSupabaseConfigurationError() {
  if (isSupabaseConfigured) {
    return null;
  }

  return "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue with Google sign-in.";
}

export function getSupabaseGoogleRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return new URL(APP_ROUTE, window.location.origin).toString();
}