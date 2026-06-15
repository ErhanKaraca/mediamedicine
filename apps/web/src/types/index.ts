export type AccountKind = 'user' | 'professional' | 'page'
export type PostType = 'standard' | 'quote' | 'repost'
export type PostVisibility = 'public' | 'followers' | 'group'

export interface Profile {
  id: string
  slug: string
  displayName: string
  bio?: string
  avatarUrl?: string
  accountKind: AccountKind
  isVerified: boolean
  followerCount: number
  followingCount: number
  postCount: number
  specialty?: string
  institution?: string
}

export type ComposerBg = 'none' | 'mist' | 'dawn' | 'lavender' | 'paper'

export type EvidenceSourceType =
  | 'publication'
  | 'clinical_guideline'
  | 'book'
  | 'news_article'
  | 'external_url'
  | 'media_asset'
  | 'own_experience'
  | 'own_opinion'
  | 'other'

export interface PostMedia {
  id: string
  url: string
  mimeType: string
  altText?: string
  width?: number
  height?: number
}

export interface PostAttachment {
  id: string
  url: string
  originalName: string
  mimeType: string
  fileSize: number
}

export interface LinkPreview {
  url: string
  title: string
  description?: string
  imageUrl?: string
  siteName?: string
}

export interface PostEvidence {
  title?: string
  sourceType: EvidenceSourceType
  identifierValue?: string
  url?: string
  year?: number
}

export interface QuotedPost {
  id: string
  author: Profile
  contentPlain: string
  createdAt: string
  media?: PostMedia[]
}

export interface PostParentContext {
  kind: 'group' | 'page'
  slug: string
  name: string
  avatarUrl?: string
}

export interface Post {
  id: string
  author: Profile
  content: string
  contentPlain: string
  postType: PostType
  visibility: PostVisibility
  createdAt: string
  likeCount: number
  commentCount: number
  repostCount: number
  isLiked: boolean
  isSaved: boolean
  hasEvidence: boolean
  mediaUrls?: string[]
  tags?: string[]
  media?: PostMedia[]
  attachments?: PostAttachment[]
  linkPreview?: LinkPreview
  quotedPost?: QuotedPost
  composerBg?: ComposerBg
  evidences?: PostEvidence[]
  parentContext?: PostParentContext
}

export interface Comment {
  id: string
  author: Profile
  content: string
  createdAt: string
  likeCount: number
}

export interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
}

export interface Conversation {
  id: string
  participant: Profile
  lastMessage: Message
  unreadCount: number
}

export interface Group {
  id: string
  slug: string
  name: string
  description: string
  memberCount: number
  postCount: number
  avatarUrl?: string
  specialty?: string
  joinPolicy: 'open' | 'request' | 'invite_only'
  isMember: boolean
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'repost'
  actor: Profile
  entityType: 'post' | 'comment'
  entityId: string
  createdAt: string
  isRead: boolean
  title: string
  body?: string
}

export interface Specialty {
  id: string
  name: string
  slug: string
  icon?: string
}
