import { useTranslation } from 'react-i18next'

export function ComingSoonPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <h1 className="text-2xl font-bold mb-2">{t(titleKey)}</h1>
        <p className="text-sm text-muted-foreground">{t('comingSoon.description')}</p>
      </div>
    </div>
  )
}

export function HelpPage() {
  const { t } = useTranslation()
  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold mb-2">{t('help.title')}</h1>
      <p className="text-muted-foreground">{t('help.comingSoon')}</p>
    </div>
  )
}
