import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Lock, Globe, UserCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { mockGroups } from '@/lib/mock-data'
import { getIntlLocale } from '@/lib/locale'
import { cn } from '@/lib/utils'
import type { Group } from '@/types'

function GroupCard({ group, onJoin }: { group: Group; onJoin: () => void }) {
  const { t, i18n } = useTranslation()
  const joinLabel =
    group.joinPolicy === 'open' ? t('groups.join') :
    group.joinPolicy === 'request' ? t('groups.request') :
    t('groups.inviteRequired')

  const policyIcon =
    group.joinPolicy === 'open' ? <Globe className="h-3 w-3" /> :
    group.joinPolicy === 'request' ? <UserCheck className="h-3 w-3" /> :
    <Lock className="h-3 w-3" />

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
            {group.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {group.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {group.specialty && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {group.specialty}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {group.memberCount.toLocaleString(getIntlLocale(i18n.language))}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {policyIcon}
                {group.joinPolicy === 'open' ? t('groups.open') : group.joinPolicy === 'request' ? t('groups.applicationShort') : t('groups.inviteOnly')}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={group.isMember ? 'outline' : 'default'}
            className="h-7 text-xs shrink-0"
            onClick={onJoin}
            disabled={group.joinPolicy === 'invite_only'}
          >
            {group.isMember ? t('groups.joined') : joinLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function GroupsPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState(mockGroups)

  const myGroups = groups.filter((g) => g.isMember)
  const discoverGroups = groups.filter((g) => !g.isMember)

  const handleJoin = (id: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, isMember: !g.isMember } : g
      )
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{t('nav.groups')}</h1>
        <Button size="sm">{t('groups.createGroup')}</Button>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="mb-4">
          <TabsTrigger value="my">{t('groups.myGroupsCount', { count: myGroups.length })}</TabsTrigger>
          <TabsTrigger value="discover">{t('groups.discover')}</TabsTrigger>
        </TabsList>

        <TabsContent value="my">
          {myGroups.length > 0 ? (
            <div className="space-y-3">
              {myGroups.map((group) => (
                <GroupCard key={group.id} group={group} onJoin={() => handleJoin(group.id)} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t('groups.noGroupsYet')}
              description={t('groups.noGroupsDesc')}
              actionLabel={t('groups.discoverGroupsAction')}
            />
          )}
        </TabsContent>

        <TabsContent value="discover">
          <div className="space-y-3">
            {discoverGroups.map((group) => (
              <GroupCard key={group.id} group={group} onJoin={() => handleJoin(group.id)} />
            ))}
            {discoverGroups.length === 0 && (
              <EmptyState title={t('groups.allGroupsJoined')} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
