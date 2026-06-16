import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  Component,
  BookOpen,
  ChevronRight,
  ArrowUpToLine,
} from 'lucide-react'
import { PostFeed } from '@/components/feed/post-feed'
import { StoryStrip } from '@/components/feed/story-strip'
import { SuggestionsStrip } from '@/components/feed/suggestions-strip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { mockGroups } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'

const trendingHashtags = [
  { tag: 'kardiyoloji', count: '2.4K' },
  { tag: 'SGLT2', count: '1.2K' },
  { tag: 'CAR-T', count: '987' },
  { tag: 'yapay_zeka', count: '854' },
  { tag: 'epilepsi', count: '731' },
]

const latestArticles = [
  { id: 'a1', title: 'ESC 2024 Kalp Yetersizliği Kılavuzu: Yeni Farmakolojik Yaklaşımlar', slug: 'esc-2024-guideline', author: 'Prof. Dr. Mehmet Demir', authorAvatar: undefined, abstract: 'Güncellenen ESC kılavuzunda SGLT2 inhibitörlerinin HFpEF hastalarında da birinci basamak tedaviye eklenmesi dikkat çekiyor.' },
  { id: 'a2', title: 'CAR-T Hücre Tedavisinde CRS Yönetimi: Güncel Protokoller', slug: 'cart-crs-management', author: 'Doç. Dr. Ali Varlık', authorAvatar: undefined, abstract: 'Sitokin salınım sendromu yönetiminde tocilizumab ve kortikosteroid kombinasyonunun etkinliği üzerine retrospektif bir analiz.' },
  { id: 'a3', title: 'Yapay Zeka Destekli Radyoloji: 2024\'te Neredeyiz?', slug: 'ai-radiology-2024', author: 'Dr. Elif Kaya', authorAvatar: undefined, abstract: 'Derin öğrenme tabanlı görüntü analizinde FDA onaylı algoritmaların sayısı 200\'ü geçti. Klinik entegrasyon hâlâ en büyük zorluk.' },
]

function GroupsCard() {
  const { t, i18n } = useTranslation()
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Component className="size-4 text-primary" />
          {t('feedPage.featuredGroups')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2 flex flex-col gap-1">
        {mockGroups.slice(0, 5).map((group) => (
          <Link
            key={group.id}
            to="/groups"
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50 transition-colors -mx-2"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
              {group.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {group.memberCount.toLocaleString(getIntlLocale(i18n.language))} {t('groups.members')}
              </p>
            </div>
            <Badge variant="secondary" className="h-5 border-0 bg-primary/10 text-primary text-[10px] font-semibold">
              {Math.floor(Math.random() * 12) + 1}
            </Badge>
          </Link>
        ))}
      </CardContent>
      <Separator />
      <div className="px-4 py-2">
        <Link to="/groups" className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
          {t('feedPage.allGroups')}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  )
}

function TrendingCard() {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          {t('feedPage.trendingTopics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-2.5">
        {trendingHashtags.map((item, i) => (
          <div key={item.tag} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-muted-foreground w-4 shrink-0 font-medium tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-primary truncate cursor-pointer hover:underline">
                #{item.tag}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-5 px-2 shrink-0 ml-2">
              {item.count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ArticlesCard() {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          New Articles
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 flex flex-col">
        {latestArticles.map((article, idx) => {
          const initials = article.author
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
          return (
            <Link
              key={article.id}
              to="/articles"
              className="group flex flex-col gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {idx > 0 && <Separator />}
              <div className="relative h-20 w-full overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-muted">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_55%)]" />
                <div className="absolute bottom-2 left-2 right-2 line-clamp-1 text-[11px] font-medium text-foreground/80">
                  {article.title}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar className="size-5 shrink-0">
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{article.author}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
      <Separator />
      <div className="px-4 py-2">
        <Link to="/articles" className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
          View All
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  )
}

function ScrollToTopFab() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon"
      className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg md:bottom-8 md:right-[max(1.5rem,env(safe-area-inset-right))] animate-in fade-in slide-in-from-bottom-4 duration-200"
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUpToLine />
    </Button>
  )
}

export function FeedPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      <div className="min-w-0 flex flex-col gap-4">
        <StoryStrip />
        <PostFeed />
      </div>

      <aside className="hidden lg:flex flex-col gap-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
        <SuggestionsStrip />
        <GroupsCard />
        <TrendingCard />
        <ArticlesCard />
      </aside>

      <ScrollToTopFab />
    </div>
  )
}
