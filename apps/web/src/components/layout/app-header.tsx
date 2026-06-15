import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, LogOut, Settings, User as UserIcon, Users, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { mockCurrentUser, mockNotifications, mockConversations } from '@/lib/mock-data'

function MessagesNavButton({ unread }: { unread: number }) {
  const { t } = useTranslation()
  return (
    <Link to="/messages">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 rounded-full"
        aria-label={t('header.messages')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="!size-[22px]"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
    </Link>
  )
}

function NotificationBell({ unread }: { unread: number }) {
  const { t } = useTranslation()
  return (
    <Link to="/notifications">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 rounded-full"
        aria-label={t('header.notifications')}
      >
        <Bell className="!size-[22px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
    </Link>
  )
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646] flex items-start justify-center bg-background/40 backdrop-blur-lg p-4 pt-[14vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-popover/95 p-5 shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 px-1">
          <h2 className="text-lg font-bold tracking-tight">{t('search.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('search.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground sm:inline-flex">
            Esc
          </kbd>
        </div>
        <div className="mt-5 px-3 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">{t('search.smartSearch')}</p>
          <p className="text-sm">{t('search.hint')}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function HeaderSearchPill() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-11 w-full items-center gap-2 rounded-full border border-input bg-white px-4 text-left text-base text-muted-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-muted/60 dark:hover:bg-muted/80"
        aria-label={t('search.startSearch')}
      >
        <Search className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate">{t('search.pillPlaceholder')}</span>
        <span className="hidden items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-sm font-mono text-muted-foreground sm:inline-flex">
          /
        </span>
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  )
}

function AccountSwitcher() {
  const { t } = useTranslation()
  const active = mockCurrentUser
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-1.5 rounded-full p-1" aria-label={t('header.accountMenu')}>
          <ProfileAvatar profile={active} size="sm" showVerified={false} showOnline />
          <ChevronDown className="!size-5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={active} size="lg" showVerified={false} showOnline />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5">
                <span className="truncate text-base font-semibold text-foreground">{active.displayName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  {t('header.professional')}
                </span>
              </p>
              <p className="truncate text-base text-muted-foreground">@{active.slug}</p>
              <Link
                to="/u/$username"
                params={{ username: active.slug }}
                className="mt-1 inline-flex items-center gap-1 text-base font-medium text-primary hover:underline"
              >
                <UserIcon className="h-4 w-4" />
                {t('header.viewProfile')}
              </Link>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex cursor-pointer items-center">
            <Users className="mr-2 h-4 w-4" />
            {t('header.manageAccounts')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            {t('nav.settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/auth/login" className="flex cursor-pointer items-center">
            <LogOut className="mr-2 h-4 w-4" />
            {t('nav.logout')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader() {
  const unreadNotifs = mockNotifications.filter((n) => !n.isRead).length
  const unreadMessages = mockConversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-18 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-8">
        <div className="flex items-center gap-8 flex-1">
          <Link
            to="/feed"
            className="flex shrink-0 items-center gap-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src="/logo.webp" alt="mediamedicine" className="h-9 w-auto" />
          </Link>

          <div className="w-full max-w-lg">
            <HeaderSearchPill />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <MessagesNavButton unread={unreadMessages} />
          <NotificationBell unread={unreadNotifs} />
          <AccountSwitcher />
        </div>
      </div>
    </header>
  )
}
