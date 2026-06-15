import { useTranslation } from 'react-i18next'
import { Bookmark } from 'lucide-react'
import { PostFeed } from '@/components/feed/post-feed'
import { EmptyState } from '@/components/shared/empty-state'
import { mockPosts } from '@/lib/mock-data'

export function SavedPage() {
  const { t } = useTranslation()
  const savedPosts = mockPosts.filter((p) => p.isSaved)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">{t('saved.title')}</h1>

      {savedPosts.length > 0 ? (
        <PostFeed showComposer={false} posts={savedPosts} />
      ) : (
        <EmptyState
          icon={Bookmark}
          title={t('saved.empty')}
          description={t('saved.emptyDesc')}
        />
      )}
    </div>
  )
}
