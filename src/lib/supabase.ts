import { createClient } from "@supabase/supabase-js";

import { APP_ROUTE } from "@/lib/authRoutes";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export function getSupabaseUrlValidationError(url?: string) {
  if (!url) {
    return "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue with Google sign-in.";
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    if (
      hostname === "supabase.com" ||
      pathname.includes("/dashboard/") ||
      pathname.includes("/project/")
    ) {
      return "VITE_SUPABASE_URL must be the project auth domain like https://<project-ref>.supabase.co, not a Supabase dashboard URL.";
    }

    if (!hostname.endsWith(".supabase.co")) {
      return "VITE_SUPABASE_URL must point to your Supabase project domain ending in .supabase.co.";
    }

    return null;
  } catch {
    return "VITE_SUPABASE_URL is not a valid URL.";
  }
}

export function getSupabaseConfigurationError(
  url = supabaseUrl,
  anonKey = supabaseAnonKey,
) {
  if (!anonKey) {
    return "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue with Google sign-in.";
  }

  return getSupabaseUrlValidationError(url);
}

const supabaseConfigurationError = getSupabaseConfigurationError();

export const isSupabaseConfigured = !supabaseConfigurationError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function getSupabaseGoogleRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${APP_ROUTE}`;
}
