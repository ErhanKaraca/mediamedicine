import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { mockSpecialties } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function OnboardingSpecialtiesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      } else {
        toast.error(t('onboarding.maxSpecialties'))
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('onboarding.stepProgress', { current: 3, total: 4 })}</span>
          <span>75%</span>
        </div>
        <Progress value={75} />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">{t('onboarding.specialties')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('onboarding.specialtiesSubtitle')} ({selected.size}/5)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {mockSpecialties.map((spec) => {
          const isSelected = selected.has(spec.id)
          return (
            <button
              key={spec.id}
              onClick={() => toggle(spec.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              )}
            >
              <span className="text-base">{spec.icon}</span>
              <span className="flex-1 truncate text-xs">{spec.name}</span>
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate({ to: '/onboarding/profile' })}
        >
          {t('onboarding.back')}
        </Button>
        <Button
          className="flex-1"
          disabled={selected.size === 0}
          onClick={() => navigate({ to: '/feed' })}
        >
          {t('onboarding.finish')}
        </Button>
      </div>

      <button
        onClick={() => navigate({ to: '/feed' })}
        className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
      >
        {t('onboarding.skipForNow')}
      </button>
    </div>
  )
}
