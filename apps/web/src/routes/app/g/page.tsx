import { useState } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Users,
  ArrowLeft,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { PostFeed } from '@/components/feed/post-feed'
import { EmptyState } from '@/components/shared/empty-state'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { PostComposer } from '@/components/composer/post-composer'
import { mockGroups, mockProfiles, mockPosts } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'

function GroupMembershipActions({
  isMember,
  joinPolicy,
  onJoin,
}: {
  isMember: boolean
  joinPolicy: string
  onJoin: () => void
}) {
  const { t } = useTranslation()
  const joinLabel =
    joinPolicy === 'open' ? t('groups.join') :
    joinPolicy === 'request' ? t('groups.request') :
    t('groups.inviteRequired')

  if (isMember) {
    return (
      <div className="flex flex-col gap-2">
        <Button className="w-full rounded-full" onClick={onJoin}>
          {t('groups.leave')}
        </Button>
        <Button variant="outline" className="w-full rounded-full">
          {t('groups.inviteRequired')}
        </Button>
      </div>
    )
  }

  return (
    <Button
      className="w-full rounded-full"
      onClick={onJoin}
      disabled={joinPolicy === 'invite_only'}
    >
      {joinLabel}
    </Button>
  )
}

const previewMembers = mockProfiles.slice(0, 8)

export function GroupDetailPage() {
  const { slug } = useParams({ from: '/_app/g/$slug' })
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [sortTab, setSortTab] = useState<'latest' | 'popular'>('latest')

  const group = mockGroups.find((g) => g.slug === slug) ?? mockGroups[0]
  const [isMember, setIsMember] = useState(group?.isMember ?? false)

  const groupPosts = mockPosts
    .filter((p) =>
      p.parentContext?.kind === 'group' && p.parentContext?.slug === slug,
    )
    .sort((a, b) =>
      sortTab === 'popular'
        ? b.likeCount - a.likeCount
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  const initials = group.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const isOwner = true

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
      {/* Feed column */}
      <div className="col-span-4 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => navigate({ to: '/groups' })}
          >
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-8 shrink-0 rounded-lg">
              <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground">{group.slug}</p>
            </div>
          </div>
        </div>

        {/* Composer for members */}
        {isMember && <PostComposer />}

        {/* Sort tabs */}
        <div className="flex items-center gap-4 border-b border-border">
          <button
            type="button"
            onClick={() => setSortTab('latest')}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              sortTab === 'latest'
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => setSortTab('popular')}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              sortTab === 'popular'
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Popular
          </button>
        </div>

        {/* Post list */}
        {groupPosts.length > 0 ? (
          <PostFeed showComposer={false} posts={groupPosts} />
        ) : (
          <EmptyState
            title={t('profile.noPostsYet')}
            description="Posts shared to this group will appear here."
          />
        )}
      </div>

      {/* Sidebar */}
      <aside className="col-span-2 flex-col gap-3 hidden md:flex md:sticky md:top-20 md:self-start md:overflow-y-auto">
        {/* Group profile card — matches profile-header styling */}
        <Card className="overflow-visible">
          <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
            {isOwner && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 size-9 rounded-full shadow-sm z-10"
                asChild
              >
                <Link to="/g/$slug/settings" params={{ slug }} aria-label="Group settings">
                  <Settings />
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-end px-4 -mt-10 mb-3">
            <Avatar className="size-16 shrink-0 rounded-full border-4 border-card">
              <AvatarFallback className="rounded-full bg-muted text-muted-foreground font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <CardContent className="px-4 pb-4 pt-0 flex flex-col gap-1.5">
            <div>
              <h2 className="text-base font-bold tracking-tight">{group.name}</h2>
              <p className="text-sm text-muted-foreground">{group.slug}</p>
            </div>

            {group.specialty && (
              <Badge variant="secondary" className="w-fit text-[11px] h-5 px-2 font-medium">
                {group.specialty}
              </Badge>
            )}

            {group.description && (
              <p className="text-sm leading-relaxed text-muted-foreground mt-1 line-clamp-3">
                {group.description}
              </p>
            )}

            <Separator className="my-3" />

            <div className="flex items-center gap-5 text-sm">
              <div className="flex flex-col items-center">
                <strong className="text-base tabular-nums text-foreground">
                  {group.memberCount.toLocaleString(getIntlLocale(i18n.language))}
                </strong>
                <span className="text-xs text-muted-foreground">{t('groups.members')}</span>
              </div>
              <div className="flex flex-col items-center">
                <strong className="text-base tabular-nums text-foreground">
                  {group.postCount.toLocaleString(getIntlLocale(i18n.language))}
                </strong>
                <span className="text-xs text-muted-foreground">{t('profile.posts')}</span>
              </div>
              <div className="flex flex-col items-center">
                <strong className="text-base tabular-nums text-foreground">
                  {group.joinPolicy === 'open' ? 'Open' :
                   group.joinPolicy === 'request' ? 'Mod.' :
                   'Invite'}
                </strong>
                <span className="text-xs text-muted-foreground">Join</span>
              </div>
            </div>

            <Separator className="my-3" />

            <GroupMembershipActions
              isMember={isMember}
              joinPolicy={group.joinPolicy}
              onJoin={() => setIsMember(!isMember)}
            />
          </CardContent>
        </Card>

        {/* Members preview */}
        <Card>
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t('groups.members')}</CardTitle>
              <Link
                to="/g/$slug/members"
                params={{ slug }}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5"
              >
                View all
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="flex">
              {previewMembers.slice(0, 6).map((m, idx) => (
                <div key={m.id} className={idx > 0 ? '-ml-2' : ''}>
                  <ProfileAvatar profile={m} size="sm" showVerified={false} />
                </div>
              ))}
              {previewMembers.length > 6 && (
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground -ml-2">
                  +{previewMembers.length - 6}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
