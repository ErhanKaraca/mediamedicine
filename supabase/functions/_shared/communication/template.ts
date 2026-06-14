import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined | null>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function getTemplate(
  admin: SupabaseClient,
  eventType: string,
  channel: string,
  locale: string,
): Promise<{ subject?: string; body: string } | null> {
  const { data } = await admin
    .from("notification_templates")
    .select("subject_template, body_template")
    .eq("key", eventType)
    .eq("channel", channel)
    .eq("locale", locale)
    .maybeSingle();

  if (!data) return null;
  return {
    subject: data.subject_template ?? undefined,
    body: data.body_template,
  };
}

export function backoffSeconds(attempt: number): number {
  return Math.min(3600, Math.pow(2, attempt) * 30);
}
