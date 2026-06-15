import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockProfiles } from '@/lib/mock-data'

export function SuggestionsStrip() {
  const { t } = useTranslation()
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">{t('feedPage.suggestedPeople')}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {mockProfiles.slice(0, 3).map((profile) => (
            <div key={profile.id} className="flex items-center gap-3">
              <Link to="/u/$username" params={{ username: profile.slug }}>
                <ProfileAvatar profile={profile} size="md" showVerified={false} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/u/$username" params={{ username: profile.slug }}>
                  <p className="text-base font-medium truncate hover:underline">
                    {profile.displayName}
                  </p>
                </Link>
                <p className="text-base text-muted-foreground truncate">{profile.specialty}</p>
              </div>
              <Button
                variant={followed.has(profile.id) ? 'outline' : 'default'}
                size="sm"
                className="h-9 text-base shrink-0 rounded-full px-4"
                onClick={() => toggle(profile.id)}
              >
                {followed.has(profile.id) ? t('profile.following') : t('profile.follow')}
              </Button>
            </div>
          ))}
        </div>
        <Link to="/explore" className="block mt-3 text-base text-primary hover:underline text-center">
          {t('common.seeMore')}
        </Link>
      </CardContent>
    </Card>
  )
}
