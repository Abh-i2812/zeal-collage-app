// lib/supabase/client.ts
// ─────────────────────────────────────────────────────────────────────
// Browser Supabase Client Initialization
// ─────────────────────────────────────────────────────────────────────
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zcoer-attendance.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo";

// Standard Supabase Client instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
