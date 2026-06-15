import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Building2, MoreHorizontal, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Profile } from '@/types'
import { getIntlLocale } from '@/lib/locale'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  profile: Profile
  isCurrentUser?: boolean
  className?: string
}

export function ProfileHeader({ profile, isCurrentUser = false, className }: ProfileHeaderProps) {
  const { t, i18n } = useTranslation()
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className={cn('', className)}>
      {/* Cover */}
      <div className="h-32 w-full rounded-t-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent-foreground/10" />

      {/* Avatar + actions row */}
      <div className="flex items-end justify-between px-4 -mt-10 mb-4">
        <ProfileAvatar profile={profile} size="xl" showVerified={false} className="ring-4 ring-background rounded-full" />
        <div className="flex items-center gap-2 pb-1">
          {isCurrentUser ? (
            <Button variant="outline" size="sm">
              {t('profile.editProfile')}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-3.5 w-3.5" />
                {t('profile.message')}
              </Button>
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? t('profile.following') : t('profile.follow')}
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{t('post.copyLink')}</DropdownMenuItem>
              <DropdownMenuItem>Raporla</DropdownMenuItem>
              <DropdownMenuItem>Engelle</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Name + badges */}
      <div className="px-4 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          {profile.isVerified && (
            <CheckCircle2 className="h-5 w-5 text-primary fill-primary-foreground" />
          )}
          {profile.accountKind === 'professional' && (
            <Badge variant="secondary" className="text-xs">
              {t('profile.professional')}
            </Badge>
          )}
          {profile.accountKind === 'page' && (
            <Badge variant="outline" className="text-xs gap-1">
              <Building2 className="h-3 w-3" />
              {t('profile.page')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{profile.slug}</p>
        {profile.specialty && (
          <p className="text-sm text-primary font-medium">{profile.specialty}</p>
        )}
        {profile.institution && (
          <p className="text-sm text-muted-foreground">{profile.institution}</p>
        )}
        {profile.bio && (
          <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 text-sm">
          <span>
            <strong>{profile.postCount.toLocaleString(getIntlLocale(i18n.language))}</strong>{' '}
            <span className="text-muted-foreground">{t('profile.posts')}</span>
          </span>
          <span>
            <strong>{profile.followerCount.toLocaleString(getIntlLocale(i18n.language))}</strong>{' '}
            <span className="text-muted-foreground">{t('profile.followers')}</span>
          </span>
          <span>
            <strong>{profile.followingCount.toLocaleString(getIntlLocale(i18n.language))}</strong>{' '}
            <span className="text-muted-foreground">{t('profile.followingCount')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
