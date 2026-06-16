import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { mockGroups, mockProfiles } from '@/lib/mock-data'

const mockMembers = mockProfiles.map((p, idx) => ({
  ...p,
  role: idx === 0 ? 'Owner' as const : idx < 3 ? 'Admin' as const : 'Member' as const,
  joinedAt: new Date(Date.now() - idx * 86400000 * 7).toISOString(),
}))

const ROLE_ORDER = ['Owner', 'Admin', 'Member']

export function GroupMembersPage() {
  const { slug } = useParams({ from: '/_app/g/$slug/members' })
  const { t } = useTranslation()
  const navigate = useNavigate()

  const group = mockGroups.find((g) => g.slug === slug) ?? mockGroups[0]

  const sorted = [...mockMembers].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={() => navigate({ to: '/g/$slug', params: { slug } })}
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight">{t('groups.members')}</h1>
          <p className="text-xs text-muted-foreground truncate">{group.name} · {sorted.length} members</p>
        </div>
      </div>

      <Card className="p-0 flex flex-col">
        {sorted.map((member, idx) => {
          const initials = member.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
          return (
            <div key={member.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Avatar className="size-10 shrink-0">
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.displayName} />}
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{member.displayName}</p>
                    {member.role !== 'Member' && (
                      <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 shrink-0">
                        <Shield className="size-3" />
                        {member.role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{member.slug}</p>
                </div>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
