import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { mockProfiles } from '@/lib/mock-data'

export function InlineSuggestions() {
  const { t } = useTranslation()
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const suggestions = mockProfiles.slice(4, 10)

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">{t('feedPage.suggestedPeople')}</h3>
          <Button variant="link" size="sm" className="h-auto px-0 text-xs text-muted-foreground">
            {t('common.seeAll')}
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
          {suggestions.map((profile) => {
            const isFollowed = followedIds.has(profile.id)
            return (
              <div key={profile.id} className="snap-start shrink-0 w-[170px]">
                <Card className="border-border/60 shadow-none">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                    <Link to="/u/$username" params={{ username: profile.slug }}>
                      <ProfileAvatar profile={profile} size="lg" />
                    </Link>
                    <div className="min-w-0 w-full">
                      <Link
                        to="/u/$username"
                        params={{ username: profile.slug }}
                        className="block truncate text-sm font-semibold hover:text-primary transition-colors"
                      >
                        {profile.displayName}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{profile.specialty}</p>
                    </div>
                    <Button
                      variant={isFollowed ? 'outline' : 'default'}
                      size="sm"
                      className="h-7 w-full text-xs rounded-full"
                      onClick={() => toggleFollow(profile.id)}
                    >
                      {isFollowed ? t('profile.following') : t('profile.follow')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
