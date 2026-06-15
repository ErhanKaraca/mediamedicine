import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/lib/locale'
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { mockConversations, mockMessagesByConversation } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

export function MessagesConversationPage() {
  const { conversationId } = useParams({ from: '/_app/messages/$conversationId' })
  const { t, i18n } = useTranslation()
  const conv = mockConversations.find((c) => c.id === conversationId) ?? mockConversations[0]
  const initialMessages = mockMessagesByConversation[conv.id] ?? []
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    const msg: Message = {
      id: `msg-new-${Date.now()}`,
      senderId: 'user-1',
      content: text.trim(),
      createdAt: new Date().toISOString(),
      isRead: true,
    }
    setMessages((prev) => [...prev, msg])
    setText('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[calc(100vh-56px)]">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h1 className="font-bold">{t('nav.messages')}</h1>
          </div>
          {mockConversations.map((c) => (
            <Link
              key={c.id}
              to="/messages/$conversationId"
              params={{ conversationId: c.id }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50',
                c.id === conv.id && 'bg-muted'
              )}
            >
              <ProfileAvatar profile={c.participant} size="sm" showVerified={false} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.participant.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{c.lastMessage.content}</p>
              </div>
              {c.unreadCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex flex-col h-[calc(100vh-56px)]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Link to="/messages" className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ProfileAvatar profile={conv.participant} size="sm" showVerified={false} showOnline />
            <div>
              <p className="font-semibold text-sm">{conv.participant.displayName}</p>
              <p className="text-xs text-green-500">{t('messages.online')}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.senderId === 'user-1'
              return (
                <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: getDateFnsLocale(i18n.language) })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={t('messages.typeMessage')}
              className="flex-1 text-sm rounded-full border border-input bg-muted px-4 py-2 outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!text.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
