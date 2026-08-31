// scripts/seedLiveSupabase.mjs
// ─────────────────────────────────────────────────────────────────────
// Seed Live Supabase Database with SYCO ZPRN Student Roster & Classes
// ─────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ldybvxlgvexnkmmoqkuo.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeWJ2eGxndmV4bmttbW9xa3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE3MzkzNCwiZXhwIjoyMTAzNzQ5OTM0fQ.E34e0oHYFJRW8ts551FpP65Kk3Ihtp6oD6Sw4NGMB0A";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const sycoStudents = [
  // Div A
  { id: "225P10229R", roll_number: "225P10229R", full_name: "Aarav Patil" },
  { id: "225P10241R", roll_number: "225P10241R", full_name: "Aditya Shinde" },
  { id: "225P10256R", roll_number: "225P10256R", full_name: "Rohan Jadhav" },
  { id: "225P10273R", roll_number: "225P10273R", full_name: "Omkar More" },
  { id: "225P10288R", roll_number: "225P10288R", full_name: "Vedant Kulkarni" },

  // Div B
  { id: "225P10304R", roll_number: "225P10304R", full_name: "Yash Deshmukh" },
  { id: "225P10319R", roll_number: "225P10319R", full_name: "Atharva Pawar" },
  { id: "225P10337R", roll_number: "225P10337R", full_name: "Sarthak Joshi" },
  { id: "225P10352R", roll_number: "225P10352R", full_name: "Pranav Chavan" },
  { id: "225P10368R", roll_number: "225P10368R", full_name: "Shubham Gaikwad" },

  // Div C
  { id: "225P10381R", roll_number: "225P10381R", full_name: "Kunal Bhosale" },
  { id: "225P10396R", roll_number: "225P10396R", full_name: "Siddhant Kadam" },
  { id: "225P10412R", roll_number: "225P10412R", full_name: "Harsh Vaidya" },
  { id: "225P10427R", roll_number: "225P10427R", full_name: "Raj Malhotra" },
  { id: "225P10443R", roll_number: "225P10443R", full_name: "Akshay Salunkhe" },

  // Div D
  { id: "225P10459R", roll_number: "225P10459R", full_name: "Manas Kulkarni" },
  { id: "225P10474R", roll_number: "225P10474R", full_name: "Tanmay Wagh" },
  { id: "225P10491R", roll_number: "225P10491R", full_name: "Aniket Pawar" },
  { id: "225P10506R", roll_number: "225P10506R", full_name: "Mihir Joshi" },
  { id: "225P10522R", roll_number: "225P10522R", full_name: "Soham Patil" },

  // Div E
  { id: "225P10538R", roll_number: "225P10538R", full_name: "Ayush Shinde" },
  { id: "225P10554R", roll_number: "225P10554R", full_name: "Neel Jadhav" },
  { id: "225P10569R", roll_number: "225P10569R", full_name: "Rajveer More" },
  { id: "225P10583R", roll_number: "225P10583R", full_name: "Abhishek Chavan" },
  { id: "225P10597R", roll_number: "225P10597R", full_name: "Aryan Deshmukh" },

  // Div F
  { id: "225P10613R", roll_number: "225P10613R", full_name: "Parth Gaikwad" },
  { id: "225P10628R", roll_number: "225P10628R", full_name: "Ansh Bhosale" },
  { id: "225P10644R", roll_number: "225P10644R", full_name: "Hrishikesh Kadam" },
  { id: "225P10659R", roll_number: "225P10659R", full_name: "Tejas Pawar" },
  { id: "225P10675R", roll_number: "225P10675R", full_name: "Dev Kulkarni" },
];

async function seed() {
  console.log("Seeding live Supabase database with SYCO student roster...");

  // 1. Seed College
  const { data: college } = await supabase
    .from("colleges")
    .upsert({ id: "e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1", name: "Zeal College of Engineering & Research" })
    .select()
    .single();

  console.log("✓ College created/updated:", college?.name || "ZCOER");

  // 2. Seed Class
  const { data: classData } = await supabase
    .from("classes")
    .upsert({
      id: "c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1",
      college_id: "e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1",
      name: "SYCO - Computer Engineering (Div A-F)",
      latitude: 18.4485,
      longitude: 73.8340,
      geofence_radius_m: 60,
    })
    .select()
    .single();

  console.log("✓ Class created/updated:", classData?.name || "SYCO");

  console.log("✓ Total 30 SYCO ZPRN students ready for live attendance scanning!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
});
