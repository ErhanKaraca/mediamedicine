import type { ChannelPlugin, DeliverResult } from "../types.ts";

function stubPlugin(channel: "slack" | "whatsapp"): ChannelPlugin {
  return {
    channel,
    async deliver(): Promise<DeliverResult> {
      return { status: "skipped", skipReason: "channel_not_configured_v1" };
    },
  };
}

export const slackPlugin = stubPlugin("slack");
export const whatsappPlugin = stubPlugin("whatsapp");
