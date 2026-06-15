import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { User, Stethoscope, Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { AccountKind } from '@/types'

interface TypeOption {
  value: AccountKind
  icon: typeof User
  title: string
  description: string
}

const options: TypeOption[] = [
  {
    value: 'user',
    icon: User,
    title: 'Bireysel Kullanıcı',
    description: 'Sağlık haberleri, güncel araştırmalar ve uzman görüşleri',
  },
  {
    value: 'professional',
    icon: Stethoscope,
    title: 'Sağlık Profesyoneli',
    description: 'KYC ile doğrulanmış hesap, gelişmiş özellikler',
  },
  {
    value: 'page',
    icon: Building2,
    title: 'Kurum / Klinik',
    description: 'Kurumsal sayfa yönetimi ve kurumsal iletişim',
  },
]

export function OnboardingTypePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<AccountKind | null>(null)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Adım 1 / 4</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">{t('onboarding.typeSelection')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('onboarding.typeSubtitle')}</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon
          const isSelected = selected === opt.value
          return (
            <Card
              key={opt.value}
              className={cn(
                'cursor-pointer transition-all border-2',
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
              onClick={() => setSelected(opt.value)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button
        className="w-full"
        disabled={!selected}
        onClick={() => navigate({ to: '/onboarding/profile' })}
      >
        {t('onboarding.continue')}
      </Button>
    </div>
  )
}
