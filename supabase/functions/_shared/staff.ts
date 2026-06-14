import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function assertPlatformStaff(
  admin: SupabaseClient,
  userId: string,
  permission?: string,
): Promise<{ role: string; permissions: string[] } | null> {
  const { data: staff } = await admin
    .from("platform_staff")
    .select("role, permissions, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!staff || staff.status !== "active") return null;
  if (staff.role === "super_admin") return { role: staff.role, permissions: staff.permissions ?? [] };
  if (permission) {
    const perms = staff.permissions ?? [];
    const roleOk = ["moderator", "support", "content_ops"].includes(staff.role);
    if (!perms.includes(permission) && !roleOk) return null;
  }
  return { role: staff.role, permissions: staff.permissions ?? [] };
}
