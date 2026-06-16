import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockGroups } from '@/lib/mock-data'
import { toast } from 'sonner'

export function GroupSettingsPage() {
  const { slug } = useParams({ from: '/_app/g/$slug/settings' })
  const { t } = useTranslation()
  const navigate = useNavigate()

  const group = mockGroups.find((g) => g.slug === slug) ?? mockGroups[0]
  const [description, setDescription] = useState(group.description)
  const [visibility, setVisibility] = useState(group.joinPolicy)

  const handleSave = () => {
    toast.success('Settings saved')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => navigate({ to: '/g/$slug', params: { slug } })}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-base font-bold tracking-tight">{t('settings.title')}</h1>
            <p className="text-xs text-muted-foreground">{group.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-1.5 rounded-full">
          <Save />
          {t('common.save')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Group Description</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Join Policy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {(['open', 'request', 'invite_only'] as const).map((policy) => (
              <Button
                key={policy}
                variant={visibility === policy ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setVisibility(policy)}
              >
                {policy === 'open' ? t('groups.open') :
                 policy === 'request' ? t('groups.request') :
                 t('groups.inviteOnly')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
