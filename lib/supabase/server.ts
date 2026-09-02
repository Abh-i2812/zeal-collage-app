// lib/supabase/server.ts
// ─────────────────────────────────────────────────────────────────────
// Server Admin Supabase Client (Bypasses RLS for API verification & exports)
// ─────────────────────────────────────────────────────────────────────
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      serviceRoleKey &&
      !serviceRoleKey.includes("your-") &&
      !serviceRoleKey.includes("******") &&
      serviceRoleKey.length > 40
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminSupabase(): any {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return createSupabaseClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
    },
  });
}
