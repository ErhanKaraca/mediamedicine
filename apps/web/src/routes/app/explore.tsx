import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { PostFeed } from '@/components/feed/post-feed'
import { mockProfiles, mockSpecialties, mockPosts } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'

export function ExplorePage() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
          className="pl-9 h-10"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="users" className="flex-1">{t('common.users')}</TabsTrigger>
          <TabsTrigger value="posts" className="flex-1">{t('common.posts')}</TabsTrigger>
          <TabsTrigger value="specialties" className="flex-1">{t('common.specialties')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* Profiles grid */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3">{t('explore.suggestedPeople')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockProfiles.slice(0, 6).map((profile) => (
                <Card key={profile.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Link to="/u/$username" params={{ username: profile.slug }}>
                      <ProfileAvatar profile={profile} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to="/u/$username" params={{ username: profile.slug }}>
                        <p className="text-sm font-semibold truncate hover:underline">
                          {profile.displayName}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.specialty}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {profile.followerCount.toLocaleString(getIntlLocale(i18n.language))} {t('profile.followers').toLowerCase()}
                      </p>
                    </div>
                    <Button
                      variant={followedIds.has(profile.id) ? 'outline' : 'default'}
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => toggleFollow(profile.id)}
                    >
                      {followedIds.has(profile.id) ? t('profile.following') : t('profile.follow')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3">{t('explore.specialtiesHeading')}</h2>
            <div className="flex flex-wrap gap-2">
              {mockSpecialties.map((spec) => (
                <Badge
                  key={spec.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors gap-1"
                >
                  <span>{spec.icon}</span>
                  {spec.name}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <ProfileAvatar profile={profile} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile.specialty}</p>
                  </div>
                  <Button
                    variant={followedIds.has(profile.id) ? 'outline' : 'default'}
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => toggleFollow(profile.id)}
                  >
                    {followedIds.has(profile.id) ? t('profile.following') : t('profile.follow')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <PostFeed showComposer={false} posts={mockPosts.slice(0, 8)} />
        </TabsContent>

        <TabsContent value="specialties">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mockSpecialties.map((spec) => (
              <Card key={spec.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <span className="text-3xl">{spec.icon}</span>
                  <p className="text-sm font-medium">{spec.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
