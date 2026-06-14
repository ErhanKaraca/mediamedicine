export const FOLLOWABLE_KINDS = ["professional", "page"] as const;

export const GROUP_MEMBER_ACTIONS = [
  "join",
  "leave",
  "request",
  "approve",
  "reject",
  "ban",
] as const;

export type GroupMemberAction = typeof GROUP_MEMBER_ACTIONS[number];

export const GROUP_ADMIN_ROLES = ["owner", "admin", "moderator"] as const;
