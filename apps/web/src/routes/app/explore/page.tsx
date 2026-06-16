import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Search,
  User as UserIcon,
  Users,
  Hash,
  Stethoscope,
  TrendingUp,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { mockProfiles, mockSpecialties, mockPosts } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'

function SmartSearchBar() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="h-14 pl-12 pr-4 rounded-2xl border-2 border-border/80 bg-card text-base shadow-sm focus-visible:border-primary/50 focus-visible:ring-primary/20"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/60">{t('search.smartSearch')}:</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px]">
          <UserIcon className="size-3" /> {t('common.users')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px]">
          <Users className="size-3" /> {t('nav.groups')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px]">
          <Hash className="size-3" /> hashtag
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px]">
          <Stethoscope className="size-3" /> icd/ ICD-11
        </span>
      </div>
    </div>
  )
}

function SuggestedPeople() {
  const { t, i18n } = useTranslation()
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const profiles = mockProfiles.slice(0, 8)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{t('explore.suggestedPeople')}</h2>
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground">
          {t('common.seeAll')}
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {profiles.map((profile) => {
          const isFollowed = followedIds.has(profile.id)
          return (
            <Card key={profile.id} className="group border-border/70 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                <Link to="/u/$username" params={{ username: profile.slug }}>
                  <ProfileAvatar profile={profile} size="xl" />
                </Link>
                <div className="min-w-0 w-full">
                  <Link
                    to="/u/$username"
                    params={{ username: profile.slug }}
                    className="block truncate text-sm font-semibold hover:text-primary transition-colors"
                  >
                    {profile.displayName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {profile.specialty}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {profile.followerCount.toLocaleString(getIntlLocale(i18n.language))} {t('profile.followers').toLowerCase()}
                  </p>
                </div>
                <Button
                  variant={isFollowed ? 'outline' : 'default'}
                  size="sm"
                  className={cn(
                    'h-7 w-full text-xs rounded-full',
                    isFollowed && 'border-primary/40 text-primary hover:bg-primary/5',
                  )}
                  onClick={() => toggleFollow(profile.id)}
                >
                  {isFollowed ? t('profile.following') : t('profile.follow')}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function SpecialtiesGrid() {
  const specialties = mockSpecialties

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-tight">Specialties</h2>
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground">
          See All
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {specialties.map((spec) => (
          <Card
            key={spec.id}
            className="group cursor-pointer border-border/70 shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
          >
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-lg transition-colors group-hover:bg-primary/20">
                {spec.icon}
              </span>
              <p className="text-xs font-medium leading-tight">{spec.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function TrendingPosts() {
  const trending = mockPosts
    .filter((p) => p.likeCount > 0)
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 3)

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Trending</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {trending.map((post, idx) => {
          const initials = post.author.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
          return (
            <Link
              key={post.id}
              to="/posts/$postId"
              params={{ postId: post.id }}
              className="group block"
            >
              <Card className="h-full border-border/70 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-6 shrink-0">
                        {post.author.avatarUrl && (
                          <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
                        )}
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium text-foreground">
                        {post.author.displayName}
                      </span>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-foreground/80 group-hover:text-foreground transition-colors">
                    {post.contentPlain}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5" /> {post.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3.5" /> {post.commentCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function ExplorePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground">
          Discover professionals, specialties, and trending content in the medical community.
        </p>
      </div>

      <SmartSearchBar />
      <SuggestedPeople />
      <TrendingPosts />
      <SpecialtiesGrid />
    </div>
  )
}
