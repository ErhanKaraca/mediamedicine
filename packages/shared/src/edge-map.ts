/**
 * REST route → Supabase Edge Function mapping.
 * Internal functions (emit-notification, communication-dispatch, content-pipeline-collect) are excluded.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EdgeRouteMapping {
  method: HttpMethod;
  path: string;
  functionName: string;
  /** Requires authenticated user JWT forwarded to edge */
  requiresAuth: boolean;
  tag: "write" | "read-proxy";
}

export const EDGE_ROUTE_MAP: EdgeRouteMapping[] = [
  { method: "POST", path: "/v1/posts", functionName: "create-post", requiresAuth: true, tag: "write" },
  { method: "PATCH", path: "/v1/posts/:id", functionName: "edit-post", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/posts/:id/comments", functionName: "create-comment", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/posts/:id/reactions", functionName: "toggle-reaction", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/feed/impressions", functionName: "record-feed-impressions", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/media/upload-init", functionName: "media-upload-init", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/media/finalize", functionName: "media-finalize", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/social/follow", functionName: "toggle-follow", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/social/block", functionName: "toggle-block", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/groups/:groupId/membership", functionName: "manage-group-membership", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/pages", functionName: "create-page", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/reports", functionName: "submit-report", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/professional-applications", functionName: "submit-professional-application", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/staff/professional-applications/:id/review", functionName: "review-professional-application", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/staff/moderation", functionName: "moderate-target", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/devices", functionName: "register-device", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/conversations", functionName: "get-or-create-conversation", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/conversations/:id/messages", functionName: "send-message", requiresAuth: true, tag: "write" },
  { method: "PATCH", path: "/v1/conversations/:id/messages/:messageId", functionName: "edit-message", requiresAuth: true, tag: "write" },
  { method: "DELETE", path: "/v1/conversations/:id/messages/:messageId", functionName: "delete-message", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/conversations/:id/read", functionName: "mark-conversation-read", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/conversations/:id/leave", functionName: "leave-conversation", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/account/delete", functionName: "delete-account", requiresAuth: true, tag: "write" },
  { method: "POST", path: "/v1/link-preview", functionName: "link-preview", requiresAuth: false, tag: "read-proxy" },
];

export const INTERNAL_EDGE_FUNCTIONS = new Set([
  "emit-notification",
  "communication-dispatch",
  "content-pipeline-collect",
  "health",
]);

export function getEdgeFunctionUrl(supabaseUrl: string, functionName: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/functions/v1/${functionName}`;
}
