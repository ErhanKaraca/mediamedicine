import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2 } from 'lucide-react'
import type { Profile } from '@/types'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface ProfileAvatarProps {
  profile: Profile
  size?: AvatarSize
  showOnline?: boolean
  showVerified?: boolean
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
  '2xl': 'h-32 w-32',
}

const fallbackSizeClasses: Record<AvatarSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
  '2xl': 'text-3xl',
}

const verifiedSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-3 w-3 -bottom-0.5 -right-0.5',
  sm: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
  md: 'h-4 w-4 bottom-0 right-0',
  lg: 'h-5 w-5 bottom-0 right-0',
  xl: 'h-6 w-6 bottom-0.5 right-0.5',
  '2xl': 'h-8 w-8 bottom-1 right-1',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileAvatar({
  profile,
  size = 'md',
  showOnline = false,
  showVerified = true,
  className,
}: ProfileAvatarProps) {
  if (!profile) {
    return (
      <div className={cn('relative inline-block', className)}>
        <Avatar className={sizeClasses[size]}>
          <AvatarFallback className={cn(fallbackSizeClasses[size], 'bg-muted text-muted-foreground')}>
            ?
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={sizeClasses[size]}>
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />}
        <AvatarFallback
          className={cn(
            fallbackSizeClasses[size],
            'bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold'
          )}
        >
          {getInitials(profile.displayName)}
        </AvatarFallback>
      </Avatar>
      {showOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
      {showVerified && profile.isVerified && (
        <CheckCircle2
          className={cn(
            'absolute text-primary fill-primary-foreground',
            verifiedSizeClasses[size]
          )}
        />
      )}
    </div>
  )
}
