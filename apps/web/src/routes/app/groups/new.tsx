import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, label: 'Public', desc: 'Anyone can find and see this group' },
  { value: 'private' as const, label: 'Private', desc: 'Only members can see content' },
  { value: 'secret' as const, label: 'Secret', desc: 'Only invited members can find it' },
] as const

const JOIN_POLICIES = [
  { value: 'open' as const, label: 'Open', desc: 'Anyone can join' },
  { value: 'request' as const, label: 'Request', desc: 'Moderators approve requests' },
  { value: 'invite_only' as const, label: 'Invite only', desc: 'Members invite new people' },
] as const

export function CreateGroupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private' | 'secret'>('public')
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'request' | 'invite_only'>('open')

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }
    toast.success('Group created!')
    navigate({ to: '/g/$slug', params: { slug: slug || name.toLowerCase().replace(/\s+/g, '-') } })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
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
          <h1 className="text-base font-bold tracking-tight">{t('groups.createGroup')}</h1>
          <p className="text-xs text-muted-foreground">Start a new medical community</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Group name</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-')) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }
              }}
              placeholder="e.g. Cardiology Discussion Group"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">g/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-group"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors',
                    visibility === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Join policy</label>
            <div className="grid grid-cols-3 gap-2">
              {JOIN_POLICIES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJoinPolicy(opt.value)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors',
                    joinPolicy === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-full mt-2 gap-2"
            onClick={handleSubmit}
          >
            <Users />
            Create group
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
