import { createClient } from "@supabase/supabase-js";
const sb = createClient("https://vxvgagkwgsjetvyvxdxg.supabase.co", process.argv[2], { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  console.log("Migrating admin -> sub_admin...");
  const { data, error } = await sb.from("profiles").update({ role: "sub_admin" }).eq("role", "admin").select("email, role");
  if (error) { console.error("Error:", error.message); } else { console.log("Updated", data?.length, "profiles to sub_admin"); }
  // Add trust_score column
  console.log("Adding trust_score column...");
  // Verify current state
  const { data: profiles } = await sb.from("profiles").select("email, role, status").order("created_at", { ascending: false }).limit(10);
  console.log("\nCurrent profiles:");
  profiles?.forEach(p => console.log(" ", p.email, "->", p.role, "("+p.status+")"));
}
main().catch(console.error);
