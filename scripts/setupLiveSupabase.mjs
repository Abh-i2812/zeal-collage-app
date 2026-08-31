import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = "https://ldybvxlgvexnkmmoqkuo.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeWJ2eGxndmV4bmttbW9xa3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE3MzkzNCwiZXhwIjoyMTAzNzQ5OTM0fQ.E34e0oHYFJRW8ts551FpP65Kk3Ihtp6oD6Sw4NGMB0A";

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Connecting to Live Supabase Project ldybvxlgvexnkmmoqkuo...");

  // Test connection by checking tables
  const { data: colleges, error: err1 } = await supabase.from("colleges").select("id").limit(1);

  if (err1) {
    console.log("Database tables need setup or schema deployment.");
    console.log("Error details:", err1.message);
  } else {
    console.log("Successfully connected to live Supabase Postgres database!");
    console.log("Colleges table query result:", colleges);
  }
}

main().catch((err) => {
  console.error("Setup script error:", err);
});
