import { cookies } from "next/headers";

export const SESSION_COOKIE = "dertlyu_uid";

export interface AppUser {
  id: string;
  /** Reserved for future auth providers (Supabase, Netlify Identity, etc.). */
  isAuthenticated: boolean;
}

/**
 * Derive the current user from the server-side session cookie.
 * Never trust a client-supplied user_id.
 * Cookie is minted in middleware when missing.
 */
export async function getCurrentUser(): Promise<AppUser> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{8,128}$/.test(existing)) {
    return { id: existing, isAuthenticated: false };
  }
  // Fallback for non-middleware contexts (tests)
  return { id: "anon_test_user", isAuthenticated: false };
}

export async function requireUser(): Promise<AppUser> {
  return getCurrentUser();
}
