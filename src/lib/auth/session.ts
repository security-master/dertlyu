import { createClient } from "@supabase/supabase-js";
import { isSupabaseAuthConfigured } from "@/lib/config/env";

export interface AuthUser {
  id: string;
  email?: string;
}

export async function getAuthUser(
  authorizationHeader: string | null
): Promise<AuthUser | null> {
  if (!isSupabaseAuthConfigured() || !authorizationHeader) {
    return null;
  }

  const token = authorizationHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export function getClientIdentifier(
  user: AuthUser | null,
  ip: string | null
): string {
  if (user) {
    return `user:${user.id}`;
  }
  return `ip:${ip ?? "unknown"}`;
}
