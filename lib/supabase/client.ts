// Browser Supabase Client Initialization
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The UI can run in demo mode without Supabase credentials.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes("******")
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
