import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FlaskConical, Users, Smartphone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const stats = [
  { value: '10.000+', label: 'Profesyonel' },
  { value: '50.000+', label: 'Paylaşılan Makale' },
  { value: '500+', label: 'Uzmanlık Grubu' },
]

export function PublicHomePage() {
  const { t } = useTranslation()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 right-0 w-[700px] h-[700px] rounded-full bg-cyan-200/30 dark:bg-cyan-900/20 blur-3xl" />
          <div className="absolute -bottom-1/4 left-0 w-[600px] h-[600px] rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Türkiye'nin Tıp Profesyonelleri Ağı
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {t('public.tagline')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('public.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/login">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                {t('public.joinFree')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/corporate/about">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                {t('public.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Hero illustration */}
          <div className="mt-12 relative">
            <div className="rounded-2xl border border-border bg-card/80 shadow-2xl overflow-hidden max-w-2xl mx-auto">
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background rounded px-3 py-0.5">
                    🔒 mediamedicine.com
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Mock posts in the preview */}
                {[
                  { name: 'Dr. Ahmet Yılmaz', spec: 'Kardiyoloji', text: 'SGLT2 inhibitörleri artık kalp yetmezliği tedavisinde birinci basamak...', likes: 184 },
                  { name: 'Dr. Elif Kaya', spec: 'Nöroloji', text: 'MS tedavisinde yüksek etkinlikli tedavilere erken geçiş stratejisi...', likes: 97 },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {item.name.split(' ').map((n) => n[0]).join('').slice(1, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">{item.name}</span>
                        <span className="text-[10px] text-primary border border-primary/30 rounded px-1">{item.spec}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">❤ {item.likes}</span>
                        <span className="text-[10px] text-muted-foreground">💬 12</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">{t('public.featuresTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FlaskConical,
                title: t('public.feature1Title'),
                desc: t('public.feature1Desc'),
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              },
              {
                icon: Users,
                title: t('public.feature2Title'),
                desc: t('public.feature2Desc'),
                color: 'bg-green-500/10 text-green-600 dark:text-green-400',
              },
              {
                icon: Smartphone,
                title: t('public.feature3Title'),
                desc: t('public.feature3Desc'),
                color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">{t('public.ctaTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('public.ctaSubtitle')}</p>
          <Link to="/auth/login">
            <Button size="lg" className="gap-2 h-12 px-10">
              Ücretsiz Katıl
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
