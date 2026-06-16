import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Building2, MoreHorizontal, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

  const displayName = profile.displayName
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('', className)}>
      {/* Cover — gradient with subtle pattern */}
      <div className="relative h-36 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      {/* Avatar + actions row */}
      <div className="flex items-end justify-between px-4 -mt-12 mb-4">
        <div className="ring-4 ring-background rounded-full">
          <ProfileAvatar profile={profile} size="2xl" showVerified={false} />
        </div>
        <div className="flex items-center gap-2 pb-1">
          {isCurrentUser ? (
            <Button variant="outline" size="sm" className="rounded-full">
              {t('profile.editProfile')}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="rounded-full">
                <MessageSquare />
                {t('profile.message')}
              </Button>
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                className={cn(
                  'rounded-full',
                  isFollowing && 'border-primary/40 text-primary hover:bg-primary/5',
                )}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? t('profile.following') : t('profile.follow')}
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>{t('post.copyLink')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                {t('post.blockUser', { username: profile.slug })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity */}
      <div className="px-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
          {profile.isVerified && (
            <CheckCircle2 className="size-5 text-primary fill-primary-foreground shrink-0" />
          )}
          {profile.accountKind === 'professional' && (
            <Badge variant="secondary" className="text-[11px] h-5 px-2 font-medium">
              {t('profile.professional')}
            </Badge>
          )}
          {profile.accountKind === 'page' && (
            <Badge variant="outline" className="text-[11px] h-5 px-2 gap-1 font-medium">
              <Building2 className="size-3" />
              {t('profile.page')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{profile.slug}</p>
        {profile.specialty && (
          <p className="text-sm font-medium text-primary">{profile.specialty}</p>
        )}
        {profile.institution && (
          <p className="text-sm text-muted-foreground">{profile.institution}</p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="px-4 mt-3">
          <p className="text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
        </div>
      )}

      {/* Stats */}
      <Separator className="my-4" />
      <div className="px-4">
        <div className="flex items-center gap-5 text-sm">
          <div className="flex flex-col items-center">
            <strong className="text-base tabular-nums text-foreground">
              {profile.postCount.toLocaleString(getIntlLocale(i18n.language))}
            </strong>
            <span className="text-xs text-muted-foreground">{t('profile.posts')}</span>
          </div>
          <div className="flex flex-col items-center">
            <strong className="text-base tabular-nums text-foreground">
              {profile.followerCount.toLocaleString(getIntlLocale(i18n.language))}
            </strong>
            <span className="text-xs text-muted-foreground">{t('profile.followers')}</span>
          </div>
          <div className="flex flex-col items-center">
            <strong className="text-base tabular-nums text-foreground">
              {profile.followingCount.toLocaleString(getIntlLocale(i18n.language))}
            </strong>
            <span className="text-xs text-muted-foreground">{t('profile.followingCount')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
