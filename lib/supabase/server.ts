// lib/supabase/server.ts
// ─────────────────────────────────────────────────────────────────────
// Server Admin Supabase Client (Bypasses RLS for API verification & exports)
// ─────────────────────────────────────────────────────────────────────
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zcoer-attendance.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo_service_key";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminSupabase(): any {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
