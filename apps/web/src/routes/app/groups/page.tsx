import { useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Users, Lock, Globe, UserCheck, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockGroups, mockProfiles } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'
import type { Group } from '@/types'

function GroupHero() {
  const { t } = useTranslation()
  const avatars = useMemo(
    () => mockProfiles.slice(0, 8).map((p) => ({ name: p.displayName, avatarUrl: p.avatarUrl, slug: p.slug })),
    [],
  )

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-primary/5 via-background to-primary/[0.03] text-center shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/20" />
      <div className="pointer-events-none absolute -left-1/4 bottom-0 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-1/4 top-0 size-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col items-center gap-4 px-4 py-10 md:py-14">
        {/* Avatar stack */}
        <div className="flex items-center">
          <div className="flex">
            {avatars.slice(0, 5).map((a, idx) => (
              <Avatar
                key={a.slug}
                className={cn(
                  'size-10 border-2 border-background ring-2 ring-background',
                  idx > 0 && '-ml-3',
                )}
              >
                {a.avatarUrl && <AvatarImage src={a.avatarUrl} alt={a.name} />}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {a.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 -ml-3">
            <span className="text-[10px] font-bold text-muted-foreground">+{avatars.length - 5}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {t('groups.discover')}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground text-balance">
          Join specialty-specific groups, share knowledge, and advance together with peers in your field.
        </p>
        <Button size="lg" className="mt-1 rounded-xl px-6 font-semibold shadow-xs" asChild>
          <Link to="/groups/new">
            <Plus />
            {t('groups.createGroup')}
          </Link>
        </Button>
      </div>
    </section>
  )
}

const POLICY_CONFIG = {
  open: { icon: Globe, labelKey: 'groups.open' },
  request: { icon: UserCheck, labelKey: 'groups.applicationShort' },
  invite_only: { icon: Lock, labelKey: 'groups.inviteOnly' },
} as const

function GroupCard({ group }: { group: Group }) {
  const { t, i18n } = useTranslation()
  const initials = group.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const policy = POLICY_CONFIG[group.joinPolicy]
  const PolicyIcon = policy.icon

  return (
    <Link
      to="/g/$slug"
      params={{ slug: group.slug }}
      className="block rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
    >
      <article className="flex items-start gap-3">
        <Avatar className="size-12 shrink-0 rounded-xl">
          {group.avatarUrl && <AvatarImage src={group.avatarUrl} alt={group.name} />}
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{group.name}</p>
            {group.specialty && (
              <Badge variant="secondary" className="shrink-0 text-[10px] h-5 px-1.5 font-normal">
                {group.specialty}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{group.slug}</p>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/80">{group.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {group.memberCount.toLocaleString(getIntlLocale(i18n.language))}
            </span>
            <span className="inline-flex items-center gap-1">
              <PolicyIcon className="size-3" />
              {t(policy.labelKey)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function GroupsPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState(mockGroups)
  const [searchQuery, setSearchQuery] = useState('')

  const myGroups = groups.filter((g) => g.isMember)
  const discoverGroups = groups.filter((g) => !g.isMember)

  const filteredDiscover = searchQuery
    ? discoverGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.specialty?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : discoverGroups

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('nav.groups')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover and join medical communities
          </p>
        </div>
      </div>

      <GroupHero />

      <Tabs defaultValue="my" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="my">
              {t('groups.myGroupsCount', { count: myGroups.length })}
            </TabsTrigger>
            <TabsTrigger value="discover">{t('groups.discover')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my" className="flex flex-col gap-3 mt-0">
          {myGroups.length > 0 ? (
            myGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          ) : (
            <EmptyState
              icon={Users}
              title={t('groups.noGroupsYet')}
              description={t('groups.noGroupsDesc')}
              actionLabel={t('groups.discoverGroupsAction')}
            />
          )}
        </TabsContent>

        <TabsContent value="discover" className="flex flex-col gap-3 mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name, slug, or specialty..."
              className="pl-9"
            />
          </div>

          {filteredDiscover.length > 0 ? (
            filteredDiscover.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          ) : (
            <EmptyState
              title={searchQuery ? t('common.noResults') : t('groups.allGroupsJoined')}
              description={searchQuery ? t('common.tryAgain') : undefined}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
