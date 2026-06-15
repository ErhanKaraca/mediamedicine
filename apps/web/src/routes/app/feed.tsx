import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PostFeed } from '@/components/feed/post-feed'
import { SuggestionsStrip } from '@/components/feed/suggestions-strip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockGroups } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'
import { TrendingUp } from 'lucide-react'

const trendingHashtags = [
  { tag: 'kardiyoloji', count: '2.4K' },
  { tag: 'SGLT2', count: '1.2K' },
  { tag: 'CAR-T', count: '987' },
  { tag: 'yapay_zeka', count: '854' },
  { tag: 'epilepsi', count: '731' },
]

export function FeedPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="min-w-0">
        <PostFeed />
      </div>

      <aside className="hidden lg:flex flex-col gap-4 sticky top-18 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
        <SuggestionsStrip />

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">{t('feedPage.featuredGroups')}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {mockGroups.slice(0, 3).map((group) => (
              <Link
                key={group.id}
                to="/groups"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-base font-bold">
                  {group.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-medium truncate">{group.name}</p>
                  <p className="text-base text-muted-foreground">
                    {group.memberCount.toLocaleString(getIntlLocale(i18n.language))} {t('groups.members').toLowerCase()}
                  </p>
                </div>
              </Link>
            ))}
            <Link to="/groups" className="block text-base text-primary hover:underline text-center mt-1">
              {t('feedPage.allGroups')}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {t('feedPage.trendingTopics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {trendingHashtags.map((item, i) => (
              <div key={item.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-base font-medium text-primary cursor-pointer hover:underline">
                    #{item.tag}
                  </span>
                </div>
                <Badge variant="secondary" className="text-base h-6 px-2.5">
                  {item.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
