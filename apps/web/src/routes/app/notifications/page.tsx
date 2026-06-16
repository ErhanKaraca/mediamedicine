import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/lib/locale'
import { Heart, MessageCircle, UserPlus, AtSign, Repeat2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { mockNotifications } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeIcon = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  repost: Repeat2,
}

const typeColor = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  follow: 'text-green-500',
  mention: 'text-purple-500',
  repost: 'text-primary',
}

function NotificationItem({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const { i18n } = useTranslation()
  const Icon = typeIcon[notif.type]
  const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
    addSuffix: true,
    locale: getDateFnsLocale(i18n.language),
  })

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
        !notif.isRead && 'bg-primary/5'
      )}
      onClick={onRead}
    >
      {/* Actor avatar + type icon */}
      <div className="relative shrink-0 mt-0.5">
        <ProfileAvatar profile={notif.actor} size="md" showVerified={false} />
        <div className={cn('absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-1 ring-border', typeColor[notif.type])}>
          <Icon className="h-2.5 w-2.5" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notif.isRead && 'font-medium')}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  )
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(mockNotifications)

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const today = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const thisWeek = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d > weekAgo && d.toDateString() !== now.toDateString()
  })

  const earlier = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d <= weekAgo
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{t('nav.notifications')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{t('notifications.unreadCount', { count: unreadCount })}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.noNotifications')}
          description={t('notifications.noNotificationsDesc')}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {today.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.today')}</p>
              </div>
              {today.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={() => markRead(n.id)} />
              ))}
            </div>
          )}

          {thisWeek.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.thisWeek')}</p>
              </div>
              {thisWeek.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={() => markRead(n.id)} />
              ))}
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.earlier')}</p>
              </div>
              {earlier.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={() => markRead(n.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
