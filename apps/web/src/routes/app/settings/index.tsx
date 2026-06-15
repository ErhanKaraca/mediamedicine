import { Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { User, Bell, Shield, Globe, Palette, HelpCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SettingsNavItem {
  to: string
  icon: typeof User
  label: string
  description: string
}

const settingsNav: SettingsNavItem[] = [
  {
    to: '/settings/profile',
    icon: User,
    label: 'Profil Ayarları',
    description: 'Ad, kullanıcı adı, fotoğraf ve biyografi',
  },
  {
    to: '/settings/notifications',
    icon: Bell,
    label: 'Bildirimler',
    description: 'Push, e-posta ve uygulama içi bildirimler',
  },
  {
    to: '/settings',
    icon: Shield,
    label: 'Gizlilik ve Güvenlik',
    description: 'Hesap gizliliği ve güvenlik ayarları',
  },
  {
    to: '/settings',
    icon: Globe,
    label: 'Dil',
    description: 'Arayüz dilini değiştirin',
  },
  {
    to: '/settings',
    icon: Palette,
    label: 'Görünüm',
    description: 'Tema ve görsel tercihler',
  },
  {
    to: '/help',
    icon: HelpCircle,
    label: 'Yardım ve Destek',
    description: 'Yardım merkezi ve iletişim',
  },
]

export function SettingsIndexPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">{t('settings.title')}</h1>

      <Card>
        {settingsNav.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={item.to + item.label}>
              {i > 0 && <Separator />}
              <Link to={item.to}>
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4.5 w-4.5 h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
