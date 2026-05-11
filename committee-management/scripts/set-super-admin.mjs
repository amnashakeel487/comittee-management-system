import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://vxvgagkwgsjetvyvxdxg.supabase.co",
  process.argv[2],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = process.argv[3];
  if (!email) { console.log("Usage: node set-super-admin.mjs <SERVICE_KEY> <email>"); process.exit(1); }

  // Find user
  const { data: users } = await sb.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);
  if (!user) { console.log("User not found:", email); process.exit(1); }
  console.log("Found user:", user.id, user.email);

  // Update profile role
  const { error } = await sb.from("profiles")
    .update({ role: "super_admin", status: "active" })
    .eq("id", user.id);

  if (error) {
    console.log("Update error:", error.message, "— trying upsert...");
    const { error: e2 } = await sb.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || email.split("@")[0],
      email,
      role: "super_admin",
      status: "active"
    }, { onConflict: "id" });
    if (e2) { console.log("Upsert error:", e2.message); process.exit(1); }
  }

  // Also update auth metadata so fallback works
  await sb.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: "super_admin" }
  });

  console.log(`\n✅  ${email} is now SUPER ADMIN\n`);

  const { data: profile } = await sb.from("profiles").select("role, status").eq("id", user.id).single();
  console.log("Profile confirmed:", profile);
}

main().catch(console.error);
