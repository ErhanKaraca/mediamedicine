import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const TTL_MS = 60_000;
let cache: { values: Map<string, unknown>; loadedAt: number } | null = null;

export async function getSystemSetting<T>(
  admin: SupabaseClient,
  key: string,
  fallback: T,
): Promise<T> {
  const now = Date.now();
  if (!cache || now - cache.loadedAt > TTL_MS) {
    const { data } = await admin.from("system_settings").select("key, value");
    cache = {
      loadedAt: now,
      values: new Map((data ?? []).map((row) => [row.key, row.value])),
    };
  }
  const value = cache.values.get(key);
  return (value as T) ?? fallback;
}

export function invalidateSettingsCache(): void {
  cache = null;
}
