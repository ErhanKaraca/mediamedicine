import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_MAX_PLAIN_CHARS = 2000;

export async function canMessageProfiles(
  admin: SupabaseClient,
  senderProfileId: string,
  recipientProfileId: string,
): Promise<boolean> {
  const { data, error } = await admin.rpc("can_message", {
    p_sender_profile_id: senderProfileId,
    p_recipient_profile_id: recipientProfileId,
  });
  if (error) {
    const { data: sender } = await admin.from("profiles").select("account_kind").eq("id", senderProfileId).single();
    const { data: recipient } = await admin.from("profiles").select("account_kind").eq("id", recipientProfileId).single();
    if (!sender || !recipient) return false;
    if (sender.account_kind === "user") {
      return recipient.account_kind === "professional" || recipient.account_kind === "page";
    }
    return recipient.account_kind === "professional" || recipient.account_kind === "page";
  }
  return Boolean(data);
}

export async function findDirectConversationId(
  admin: SupabaseClient,
  profileA: string,
  profileB: string,
): Promise<string | null> {
  const { data } = await admin.rpc("find_direct_conversation", {
    p_profile_a: profileA,
    p_profile_b: profileB,
  });
  return data ?? null;
}

export async function getOrCreateDirectConversation(
  admin: SupabaseClient,
  profileA: string,
  profileB: string,
): Promise<{ conversationId: string; created: boolean } | null> {
  const { data, error } = await admin.rpc("get_or_create_direct_conversation", {
    p_profile_a: profileA,
    p_profile_b: profileB,
  });
  if (error || !data?.length) return null;
  const row = data[0] as { conversation_id: string; created: boolean };
  return { conversationId: row.conversation_id, created: row.created };
}
