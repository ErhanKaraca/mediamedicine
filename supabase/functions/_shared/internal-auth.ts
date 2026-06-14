/** Strict service-role / cron auth for internal edge functions. */

export function authorizeServiceRole(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey) return false;

  const auth = req.headers.get("Authorization") ?? "";
  if (auth === `Bearer ${serviceKey}`) return true;

  const cronSecret = Deno.env.get("COMMUNICATION_CRON_SECRET") ?? "";
  const cronHeader = req.headers.get("X-Cron-Secret") ?? "";
  return Boolean(cronSecret && cronHeader === cronSecret);
}
