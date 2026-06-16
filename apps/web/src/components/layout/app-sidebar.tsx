import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Compass,
  Component,
  GraduationCap,
  BookOpen,
  Library,
  Video,
  CalendarDays,
  Bookmark,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type SidebarNavItem = {
  to: string
  icon: LucideIcon
  labelKey: string
  activeExact?: boolean
}

const NAV_ITEMS: SidebarNavItem[] = [
  { to: '/feed', icon: Home, labelKey: 'nav.feed' },
  { to: '/explore', icon: Compass, labelKey: 'nav.explore' },
  { to: '/groups', icon: Component, labelKey: 'nav.groups' },
  { to: '/courses', icon: GraduationCap, labelKey: 'nav.courses' },
  { to: '/articles', icon: BookOpen, labelKey: 'nav.articles' },
  { to: '/journals', icon: Library, labelKey: 'nav.journals' },
  { to: '/consultations', icon: Video, labelKey: 'nav.consultations', activeExact: true },
  { to: '/events', icon: CalendarDays, labelKey: 'nav.events' },
]

function NavLink({
  to,
  icon: Icon,
  active,
  size = 'md',
  ariaLabel,
}: {
  to: string
  icon: LucideIcon
  active: boolean
  size?: 'sm' | 'md'
  ariaLabel: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      className={cn(
        'group shrink-0 rounded-full transition-colors',
        size === 'sm' ? 'h-10 w-10' : 'h-15 w-15',
        active
          ? 'text-primary bg-card'
          : 'text-muted-foreground bg-transparent hover:bg-card hover:text-primary',
      )}
      asChild
    >
      <Link to={to}>
        <Icon
          className={cn(
            size === 'sm' ? '!size-4' : '!size-6',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
          )}
        />
      </Link>
    </Button>
  )
}

export function AppSidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (to: string, exact?: boolean) =>
    exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <aside className="sticky top-14 flex shrink-0 flex-col self-start overflow-y-auto py-6">
      <div className="flex flex-1 flex-col items-center gap-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            ariaLabel={t(item.labelKey)}
            active={isActive(item.to, item.activeExact)}
            size="md"
          />
        ))}
      </div>

      <Separator className="my-5 bg-border/80" />

      <div className="flex flex-col items-center gap-5">
        <NavLink
          to="/saved"
          icon={Bookmark}
          ariaLabel={t('nav.saved')}
          active={isActive('/saved')}
          size="sm"
        />
        <NavLink
          to="/settings"
          icon={Settings}
          ariaLabel={t('nav.settings')}
          active={isActive('/settings')}
          size="sm"
        />
      </div>
    </aside>
  )
}
