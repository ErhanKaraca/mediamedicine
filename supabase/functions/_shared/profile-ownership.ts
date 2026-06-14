import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function isProfileOwnedByUser(
  client: SupabaseClient,
  profileId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from("profiles")
    .select("owner_user_id")
    .eq("id", profileId)
    .maybeSingle();
  return data?.owner_user_id === userId;
}
