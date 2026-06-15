import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PostCard } from '@/components/feed/post-card'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { getDateFnsLocale } from '@/lib/locale'
import { Heart, MessageCircle } from 'lucide-react'
import { mockPosts, mockComments, mockCurrentUser } from '@/lib/mock-data'
import { useState } from 'react'

export function PostDetailPage() {
  const { postId } = useParams({ from: '/_app/posts/$postId' })
  const { t, i18n } = useTranslation()
  const post = mockPosts.find((p) => p.id === postId) ?? mockPosts[0]
  const [commentText, setCommentText] = useState('')

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Back button */}
      <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Link>

      {/* Post */}
      <PostCard post={post} expanded />

      {/* Comments section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">
            {t('post.commentsTitle', { count: post.commentCount })}
          </h2>
        </div>

        {/* Add comment */}
        <div className="flex gap-3 mb-6">
          <ProfileAvatar profile={mockCurrentUser} size="sm" showVerified={false} />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('post.writeComment')}
              className="flex-1 text-sm rounded-full border border-input bg-muted px-4 py-2 outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" disabled={!commentText.trim()} className="rounded-full">
              {t('messages.send')}
            </Button>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Comments list */}
        {mockComments.length > 0 ? (
          <div className="space-y-4">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <ProfileAvatar profile={comment.author} size="sm" showVerified={false} />
                <div className="flex-1 min-w-0">
                  <div className="bg-muted rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Link
                        to="/u/$username"
                        params={{ username: comment.author.slug }}
                        className="text-xs font-semibold hover:underline"
                      >
                        {comment.author.displayName}
                      </Link>
                      {comment.author.specialty && (
                        <span className="text-[10px] text-muted-foreground">
                          · {comment.author.specialty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2">
                    <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                      <Heart className="h-3 w-3" />
                      {comment.likeCount}
                    </button>
                    <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                      <MessageCircle className="h-3 w-3" />
                      {t('post.reply')}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: getDateFnsLocale(i18n.language),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('post.noComments')}
            description={t('post.noCommentsDesc')}
          />
        )}
      </div>
    </div>
  )
}
