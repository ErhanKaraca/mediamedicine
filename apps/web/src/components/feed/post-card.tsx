import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatShortRelativeTime } from '@/lib/format-time'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  BookOpenText,
  Globe,
  Lock,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PostCardMediaGrid } from '@/components/feed/post-card-media-grid'
import { PostCardLinkPreview } from '@/components/feed/post-card-link-preview'
import { PostCardAttachments } from '@/components/feed/post-card-attachments'
import { PostCardEvidences } from '@/components/feed/post-card-evidences'
import { QuotedPostEmbed } from '@/components/feed/quoted-post-embed'
import { MediaLightbox } from '@/components/feed/media-lightbox'
import type { Post, PostParentContext } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface PostCardProps {
  post: Post
  className?: string
  expanded?: boolean
}

const POST_TYPE_LABELS: Partial<Record<Post['postType'], 'post.typeQuote' | 'post.typeRepost'>> = {
  quote: 'post.typeQuote',
  repost: 'post.typeRepost',
}

function formatCount(n: number): string {
  if (n < 1000) return n.toString()
  if (n < 10000) return `${(n / 1000).toFixed(1)}B`
  return `${Math.floor(n / 1000)}B`
}

function getContextInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ParentContextBadge({ context }: { context: PostParentContext }) {
  return (
    <>
      <Avatar className="h-5 w-5 shrink-0">
        {context.avatarUrl && (
          <AvatarImage src={context.avatarUrl} alt={context.name} />
        )}
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-[9px] font-semibold text-primary">
          {getContextInitials(context.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-xs font-medium text-foreground/80 transition-colors group-hover/context:text-foreground">
        {context.name}
      </span>
    </>
  )
}

function VisibilityIcon({ v }: { v: Post['visibility'] }) {
  if (v === 'public') return <Globe className="h-4 w-4" />
  if (v === 'group') return <Lock className="h-4 w-4" />
  return <UserRound className="h-4 w-4" />
}

export function PostCard({ post, className, expanded = false }: PostCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  })

  const timeAgo = formatShortRelativeTime(post.createdAt)
  const typeLabelKey = POST_TYPE_LABELS[post.postType]
  const typeLabel = typeLabelKey ? t(typeLabelKey) : undefined
  const composerBg = post.composerBg && post.composerBg !== 'none' ? post.composerBg : null
  const hasEvidences = (post.evidences?.length ?? 0) > 0

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    setLikeCount((c) => (isLiked ? c - 1 : c + 1))
  }
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
    toast.success(isSaved ? t('post.unsaved') : t('post.saved'))
  }
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(t('common.copySuccess'))
  }
  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate({ to: '/posts/$postId', params: { postId: post.id } })
  }
  const handleGoToProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate({ to: '/u/$username', params: { username: post.author?.slug ?? '' } })
  }
  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(t('post.reportReceived'))
  }
  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(t('post.userBlocked', { username: post.author?.slug ?? '' }))
  }
  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(t('post.repostedToast'))
  }
  const toggleEvidences = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEvidenceOpen((v) => !v)
  }
  const openLightbox = (i: number) => setLightbox({ open: true, index: i })

  const goToDetail = (e: React.MouseEvent) => {
    if (expanded) return
    const interactive = (e.target as HTMLElement).closest('a, button, [role="menuitem"]')
    if (interactive) return
    navigate({ to: '/posts/$postId', params: { postId: post.id } })
  }

  return (
    <Card
      className={cn(
        'rounded-xl shadow-sm transition-colors',
        !expanded && 'cursor-pointer hover:bg-accent/30',
        className,
      )}
      onClick={goToDetail}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <Link
            to="/u/$username"
            params={{ username: post.author?.slug ?? '' }}
            className="shrink-0 self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileAvatar profile={post.author} size="lg" showVerified={false} />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex items-start gap-2">
              {/* Two-line identity */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Line 1: display name + badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    to="/u/$username"
                    params={{ username: post.author?.slug ?? '' }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 truncate text-base font-semibold leading-tight text-foreground hover:text-primary transition-colors"
                  >
                    {post.author?.displayName}
                  </Link>

                  {typeLabel && (
                    <Badge
                      variant="secondary"
                      className="h-6 border-0 bg-primary/10 px-2 text-sm font-medium text-primary"
                    >
                      {typeLabel}
                    </Badge>
                  )}
                </div>

                {/* Line 2: @slug + visibility */}
                <div className="flex items-center gap-1.5 leading-tight">
                  <Link
                    to="/u/$username"
                    params={{ username: post.author?.slug ?? '' }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 truncate text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    @{post.author?.slug}
                  </Link>
                  <span className="text-sm text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground">
                    <VisibilityIcon v={post.visibility} />
                  </span>
                </div>
              </div>

              {/* Right: time + more menu */}
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {!expanded && (
                      <DropdownMenuItem onClick={handleViewDetail}>
                        {t('post.viewDetail')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleGoToProfile}>
                      {t('post.goToProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>{t('post.copyLink')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleReport}>
                      {t('post.reportPost')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock}>
                      {t('post.blockUser', { username: post.author?.slug ?? '' })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Group / page context — thin bar below identity */}
            {post.parentContext && (
              <Link
                to={
                  post.parentContext.kind === 'page'
                    ? '/u/$username'
                    : '/g/$slug'
                }
                params={
                  post.parentContext.kind === 'page'
                    ? { username: post.parentContext.slug }
                    : { slug: post.parentContext.slug }
                }
                onClick={(e) => e.stopPropagation()}
                className="group/context mt-1.5 flex items-end gap-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 12 14"
                  className="mb-[5px] h-3.5 w-3 shrink-0 text-muted-foreground/45 transition-colors group-hover/context:text-muted-foreground/70"
                >
                  <path
                    d="M3 12V4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 12H10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 4L1.25 6.25M3 4L4.75 6.25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border/50 bg-muted/25 py-0.5 pl-0.5 pr-2.5 transition-colors group-hover/context:bg-muted/40 group-hover/context:border-border/70">
                  <ParentContextBadge context={post.parentContext} />
                </div>
              </Link>
            )}

            {/* Content with inline hashtags */}
            {(() => {
              const tagSuffix =
                post.tags && post.tags.length > 0
                  ? '\n\n' + post.tags.map((t) => `#${t}`).join(' ')
                  : ''
              const fullText = (post.contentPlain ?? '') + tagSuffix
              if (!fullText) return null

              const CHAR_LIMIT = 360
              const isLong = !expanded && fullText.length > CHAR_LIMIT
              const displayText = isLong
                ? fullText.slice(0, CHAR_LIMIT).replace(/\s+\S*$/, '') + '…'
                : fullText

              const parts = displayText.split(/(#[\p{L}\p{N}_-]+)/gu)

              return (
                <div
                  className={cn(
                    'mt-2 text-base leading-relaxed text-foreground whitespace-pre-wrap',
                    composerBg && `composer-surface-${composerBg} rounded-xl px-4 py-3 mt-3`,
                  )}
                >
                  {parts.map((part, i) =>
                    part.startsWith('#') ? (
                      <span
                        key={i}
                        className="text-primary hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {part}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    ),
                  )}
                  {isLong && (
                    <>
                      {' '}
                      <Link
                        to="/posts/$postId"
                        params={{ postId: post.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-primary hover:underline"
                      >
                        {t('common.readMore')}
                      </Link>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Media grid */}
            {post.media && <PostCardMediaGrid media={post.media} onOpen={openLightbox} />}

            {/* Attachments */}
            <PostCardAttachments attachments={post.attachments} />

            {/* Link preview */}
            {post.linkPreview && <PostCardLinkPreview data={post.linkPreview} />}

            {/* Quoted post embed */}
            {post.quotedPost && (
              <div className="mt-3">
                <QuotedPostEmbed quoted={post.quotedPost} />
              </div>
            )}

            {/* Actions row */}
            <div className="-ml-1.5 mt-3 flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  'h-auto gap-1.5 rounded-full px-3 py-2 text-base font-normal',
                  isLiked
                    ? 'text-rose-500 hover:bg-rose-500/10 hover:text-rose-500'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground',
                )}
              >
                <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
                {formatCount(likeCount)}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: '/posts/$postId', params: { postId: post.id } })
                }}
                className="h-auto gap-1.5 rounded-full px-3 py-2 text-base font-normal text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                {formatCount(post.commentCount)}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRepost}
                className="h-auto gap-1.5 rounded-full px-3 py-2 text-base font-normal text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <Repeat2 className="h-5 w-5" />
                {formatCount(post.repostCount)}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={cn(
                  'ml-auto h-auto gap-1.5 rounded-full px-3 py-2 text-base font-normal',
                  isSaved
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                )}
              >
                <Bookmark className={cn('h-5 w-5', isSaved && 'fill-current')} />
              </Button>

              {hasEvidences && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleEvidences}
                  aria-expanded={evidenceOpen}
                  aria-label={t('post.showEvidences')}
                  className={cn(
                    'h-auto gap-1.5 rounded-full px-3 py-2 text-base font-normal',
                    evidenceOpen
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  <BookOpenText className="h-5 w-5" />
                  <span>{post.evidences!.length}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      evidenceOpen && 'rotate-180',
                    )}
                  />
                </Button>
              )}
            </div>

            {/* Collapsible evidences */}
            {hasEvidences && evidenceOpen && (
              <div
                className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-primary" />
                  <p className="text-base font-semibold text-foreground">
                    {t('post.evidencesTitle', { count: post.evidences!.length })}
                  </p>
                </div>
                <PostCardEvidences items={post.evidences} />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <MediaLightbox
        open={lightbox.open}
        items={post.media ?? []}
        index={lightbox.index}
        onClose={() => setLightbox({ open: false, index: 0 })}
        onIndexChange={(i) => setLightbox({ open: true, index: i })}
      />
    </Card>
  )
}

export function PostCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-36" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-4 pt-3">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
