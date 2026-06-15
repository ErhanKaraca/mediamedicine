import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings.language')}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => i18n.changeLanguage('en')}
          className={i18n.language?.startsWith('en') ? 'font-semibold' : ''}
        >
          🇬🇧 {t('settings.languageEn')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => i18n.changeLanguage('tr')}
          className={i18n.language?.startsWith('tr') ? 'font-semibold' : ''}
        >
          🇹🇷 {t('settings.languageTr')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
