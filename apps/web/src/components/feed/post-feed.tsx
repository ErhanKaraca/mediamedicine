import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { PostCard, PostCardSkeleton } from '@/components/feed/post-card'
import { PostComposer } from '@/components/composer/post-composer'
import { InlineSuggestions } from '@/components/feed/inline-suggestions'
import { EmptyState } from '@/components/shared/empty-state'
import { useMockQuery } from '@/hooks/use-mock-query'
import { mockPosts } from '@/lib/mock-data'

interface PostFeedProps {
  showComposer?: boolean
  posts?: typeof mockPosts
}

const PAGE_SIZE = 10

export function PostFeed({ showComposer = true, posts }: PostFeedProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useMockQuery(['posts'], posts ?? mockPosts, 500)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [data])

  const visiblePosts = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await new Promise((r) => setTimeout(r, 600))
    setVisibleCount((prev) => prev + PAGE_SIZE)
    setLoadingMore(false)
  }, [loadingMore, hasMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {showComposer && <PostComposer />}
        {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {showComposer && <PostComposer />}

      {visiblePosts.length === 0 ? (
        <EmptyState title={t('common.empty')} description={t('profile.noPostsDesc')} />
      ) : (
        <>
          {visiblePosts.map((post, index) => (
            <div key={post.id}>
              <PostCard post={post} />
              {index === 2 && showComposer && <InlineSuggestions />}
            </div>
          ))}

          <div ref={sentinelRef} />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasMore && visiblePosts.length > 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">All caught up</p>
          )}
        </>
      )}
    </div>
  )
}
