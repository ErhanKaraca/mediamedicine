import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { NOTIFICATION_CHANNELS } from "../config.ts";

export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

export interface DeliverResult {
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string;
  error?: string;
  skipReason?: string;
}

export interface NotificationRow {
  id: string;
  recipient_user_id: string;
  recipient_profile_id: string | null;
  actor_profile_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
}

export interface DeliveryRow {
  id: string;
  notification_id: string;
  channel: string;
  status: string;
  attempts: number;
  max_attempts: number;
}

export interface DeliverContext {
  admin: SupabaseClient;
  delivery: DeliveryRow;
  notification: NotificationRow;
  locale: string;
}

export interface ChannelPlugin {
  channel: NotificationChannel;
  deliver(ctx: DeliverContext): Promise<DeliverResult>;
}
