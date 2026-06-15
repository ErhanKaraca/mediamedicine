import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

type NotifType = 'like' | 'comment' | 'follow' | 'mention' | 'repost'
type Channel = 'push' | 'email' | 'inApp'

type Settings = Record<NotifType, Record<Channel, boolean>>

const initialSettings: Settings = {
  like: { push: true, email: false, inApp: true },
  comment: { push: true, email: true, inApp: true },
  follow: { push: true, email: false, inApp: true },
  mention: { push: true, email: true, inApp: true },
  repost: { push: false, email: false, inApp: true },
}

const notifLabelKeys: Record<NotifType, 'settings.notifLike' | 'settings.notifComment' | 'settings.notifFollow' | 'settings.notifMention' | 'settings.notifRepost'> = {
  like: 'settings.notifLike',
  comment: 'settings.notifComment',
  follow: 'settings.notifFollow',
  mention: 'settings.notifMention',
  repost: 'settings.notifRepost',
}

export function SettingsNotificationsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Settings>(initialSettings)

  const toggle = (type: NotifType, channel: Channel) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }))
  }

  const handleSave = () => {
    toast.success(t('settings.notifSaved'))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{t('settings.notifications')}</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1" />
            <div className="text-xs font-semibold text-center text-muted-foreground">{t('settings.notifPush')}</div>
            <div className="text-xs font-semibold text-center text-muted-foreground">{t('settings.notifEmail')}</div>
            <div className="text-xs font-semibold text-center text-muted-foreground">{t('settings.notifInApp')}</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(Object.entries(settings) as [NotifType, Record<Channel, boolean>][]).map(
            ([type, channels], i) => (
              <div key={type}>
                {i > 0 && <Separator />}
                <div className="grid grid-cols-4 gap-2 items-center px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{t(notifLabelKeys[type])}</p>
                  </div>
                  {(['push', 'email', 'inApp'] as Channel[]).map((channel) => (
                    <div key={channel} className="flex justify-center">
                      <Switch
                        checked={channels[channel]}
                        onCheckedChange={() => toggle(type, channel)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave}>{t('settings.saveChanges')}</Button>
      </div>
    </div>
  )
}
