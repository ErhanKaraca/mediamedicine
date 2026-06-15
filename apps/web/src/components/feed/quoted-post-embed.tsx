import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { getDateFnsLocale } from '@/lib/locale'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import type { QuotedPost } from '@/types'

export function QuotedPostEmbed({ quoted }: { quoted: QuotedPost }) {
  const { i18n } = useTranslation()
  const timeAgo = formatDistanceToNow(new Date(quoted.createdAt), {
    addSuffix: true,
    locale: getDateFnsLocale(i18n.language),
  })

  return (
    <Link
      to="/posts/$postId"
      params={{ postId: quoted.id }}
      onClick={(e) => e.stopPropagation()}
      className="block overflow-hidden rounded-xl border border-border bg-background/50 p-3 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center gap-2">
        <ProfileAvatar profile={quoted.author} size="sm" showVerified={false} />
        <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
          <span className="truncate text-base font-semibold">{quoted.author?.displayName}</span>
          <span className="truncate text-base text-muted-foreground">@{quoted.author?.slug}</span>
          <span className="text-base text-muted-foreground/50">·</span>
          <span className="shrink-0 text-base text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 text-base text-foreground/90">{quoted.contentPlain}</p>
    </Link>
  )
}
