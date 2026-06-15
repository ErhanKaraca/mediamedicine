import { useMemo } from 'react'
import { PostCard, PostCardSkeleton } from '@/components/feed/post-card'
import { PostComposer } from '@/components/composer/post-composer'
import { useMockQuery } from '@/hooks/use-mock-query'
import { mockPosts } from '@/lib/mock-data'

interface PostFeedProps {
  showComposer?: boolean
  posts?: typeof mockPosts
}

export function PostFeed({ showComposer = true, posts }: PostFeedProps) {
  const { data, isLoading } = useMockQuery(['posts'], posts ?? mockPosts, 500)

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [data])

  return (
    <div className="space-y-3">
      {showComposer && <PostComposer />}

      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
        : sorted.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
