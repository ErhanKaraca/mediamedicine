import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/lib/locale'
import { MessageSquare, PenSquare } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { mockConversations } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function MessagesPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[calc(100vh-56px)]">
        {/* Conversation list */}
        <div className="border-r border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="font-bold">{t('nav.messages')}</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <PenSquare className="h-4 w-4" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {mockConversations.map((conv) => (
              <Link
                key={conv.id}
                to="/messages/$conversationId"
                params={{ conversationId: conv.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="relative shrink-0">
                  <ProfileAvatar profile={conv.participant} size="md" showVerified={false} />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-semibold' : 'font-medium')}>
                      {conv.participant.displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        addSuffix: false,
                        locale: getDateFnsLocale(i18n.language),
                      })}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs truncate mt-0.5',
                    conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {conv.lastMessage.senderId === 'user-1' ? 'Sen: ' : ''}{conv.lastMessage.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty state on desktop */}
        <div className="hidden md:flex items-center justify-center">
          <EmptyState
            icon={MessageSquare}
            title={t('messages.selectConversation')}
            description={t('messages.selectConversationDesc')}
          />
        </div>
      </div>
    </div>
  )
}
