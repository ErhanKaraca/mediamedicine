import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Camera, CheckCircle2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { cn } from '@/lib/utils'

const schema = z.object({
  displayName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire'),
  bio: z.string().max(200, 'Biyografi en fazla 200 karakter').optional(),
})

type FormValues = z.infer<typeof schema>

const TAKEN_USERNAMES = ['admin', 'doktor', 'test', 'mediamedicine']

export function OnboardingProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [usernameChecked, setUsernameChecked] = useState<boolean | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', username: '', bio: '' },
  })

  const watchedUsername = form.watch('username')

  const checkUsername = () => {
    const u = watchedUsername.toLowerCase()
    setUsernameChecked(!TAKEN_USERNAMES.includes(u) && u.length >= 3)
  }

  const onSubmit = () => {
    navigate({ to: '/onboarding/specialties' })
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Adım 2 / 4</span>
          <span>50%</span>
        </div>
        <Progress value={50} />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">{t('onboarding.profileSetup')}</h1>
      </div>

      {/* Avatar upload */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">AB</span>
          </div>
          <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.displayName')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('onboarding.displayNamePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.username')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <Input
                      {...field}
                      className="pl-7 pr-10"
                      placeholder={t('onboarding.usernamePlaceholder')}
                      onChange={(e) => {
                        field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        setUsernameChecked(null)
                      }}
                      onBlur={checkUsername}
                    />
                    {usernameChecked !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameChecked
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-destructive" />
                        }
                      </div>
                    )}
                  </div>
                </FormControl>
                {usernameChecked !== null && (
                  <p className={cn('text-xs', usernameChecked ? 'text-green-600' : 'text-destructive')}>
                    {usernameChecked ? t('onboarding.usernameAvailable') : t('onboarding.usernameTaken')}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.bio')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('onboarding.bioPlaceholder')}
                    className="resize-none"
                    rows={3}
                  />
                </FormControl>
                <FormDescription>{(field.value ?? '').length}/200</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate({ to: '/onboarding/type' })}
            >
              {t('onboarding.back')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('onboarding.continue')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
