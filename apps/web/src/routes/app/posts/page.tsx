import { useParams, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { PostCard } from '@/components/feed/post-card'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { mockPosts, mockComments, mockCurrentUser } from '@/lib/mock-data'
import { getDateFnsLocale } from '@/lib/locale'
import type { Comment } from '@/types'

function CommentAction({
  icon: Icon,
  count,
  active,
  label,
  onClick,
}: {
  icon: typeof Heart
  count: number
  active?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className={active ? 'fill-current text-destructive' : ''} />
      {count > 0 && <span>{count}</span>}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function CommentRow({
  comment,
  depth,
  onReply,
}: {
  comment: Comment
  depth: number
  onReply: (comment: Comment) => void
}) {
  const { i18n } = useTranslation()
  const [liked, setLiked] = useState(false)
  const likeCount = comment.likeCount + (liked ? 1 : 0)

  return (
    <div
      className="flex gap-3 py-4"
      style={{ paddingLeft: depth > 0 ? Math.min(depth, 6) * 16 : 0 }}
    >
      <ProfileAvatar profile={comment.author} size="sm" showVerified={false} className="shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="bg-muted rounded-2xl px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{comment.author.displayName}</span>
            <span className="text-xs text-muted-foreground">@{comment.author.slug}</span>
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: getDateFnsLocale(i18n.language),
              })}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1.5 px-2">
          <CommentAction
            icon={Heart}
            count={likeCount}
            active={liked}
            label="Like"
            onClick={() => setLiked(!liked)}
          />
          <CommentAction
            icon={MessageCircle}
            count={0}
            label="Reply"
            onClick={() => onReply(comment)}
          />
        </div>
      </div>
    </div>
  )
}

export function PostDetailPage() {
  const { postId } = useParams({ from: '/_app/posts/$postId' })
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const post = mockPosts.find((p) => p.id === postId) ?? mockPosts[0]
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [localComments, setLocalComments] = useState<Comment[]>(mockComments)

  const handleBack = () => {
    navigate({ to: '/feed' })
  }

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    toast.success('Comment posted')
    setCommentText('')
    setReplyingTo(null)
  }

  const rootComments = useMemo(
    () => localComments.filter((c) => !c.parentCommentId),
    [localComments],
  )

  const getReplies = (parentId: string) =>
    localComments.filter((c) => c.parentCommentId === parentId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft />
        </Button>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t('post.viewDetail')}</span>
        </div>
      </div>

      {/* Post */}
      <PostCard post={post} expanded />

      {/* Comments section */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">
            {t('post.commentsTitle', { count: localComments.length })}
          </CardTitle>
        </CardHeader>

        <Separator />

        {/* Comment composer */}
        <div className="px-4 py-4">
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">
                {t('post.reply')} to <span className="font-medium text-foreground">@{replyingTo.author.slug}</span>
              </span>
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0 text-xs shrink-0"
                onClick={() => setReplyingTo(null)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <ProfileAvatar profile={mockCurrentUser} size="sm" showVerified={false} />
            <div className="flex-1 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                placeholder={replyingTo ? `${t('post.writeComment')}...` : t('post.writeComment')}
                className="flex-1 rounded-full"
              />
              <Button
                size="sm"
                disabled={!commentText.trim()}
                className="rounded-full shrink-0"
                onClick={handleSubmitComment}
              >
                {t('messages.send')}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comments list */}
        <CardContent className="px-4 pb-2 pt-0">
          {rootComments.length === 0 ? (
            <EmptyState
              title={t('post.noComments')}
              description={t('post.noCommentsDesc')}
            />
          ) : (
            rootComments.map((comment) => (
              <div key={comment.id}>
                <CommentRow
                  comment={comment}
                  depth={0}
                  onReply={setReplyingTo}
                />
                {getReplies(comment.id).map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    depth={1}
                    onReply={setReplyingTo}
                  />
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
