import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { mockProfiles } from '@/lib/mock-data'
import { toast } from 'sonner'

const moderationQueue = mockProfiles.slice(0, 3).map((p) => ({
  id: p.id,
  name: p.displayName,
  slug: p.slug,
  specialty: p.specialty,
}))

export function GroupModerationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queue, setQueue] = useState(moderationQueue)
  const [note, setNote] = useState('')

  const approve = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    toast.success('Approved')
  }

  const reject = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    toast.success('Rejected')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={() => navigate({ to: '/groups' })}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-base font-bold tracking-tight">Group Moderation</h1>
          <p className="text-xs text-muted-foreground">{queue.length} pending {queue.length === 1 ? 'request' : 'requests'}</p>
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState title="All clear" description="No pending moderation requests." />
      ) : (
        <div className="flex flex-col gap-3">
          {queue.map((item) => {
            const initials = item.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">@{item.slug}</p>
                    </div>
                    {item.specialty && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                        {item.specialty}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Reason (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => reject(item.id)}
                    >
                      <XCircle />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-full"
                      onClick={() => approve(item.id)}
                    >
                      <CheckCircle2 />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
