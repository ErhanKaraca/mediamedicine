import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { mockCurrentUser } from '@/lib/mock-data'
import { toast } from 'sonner'

const schema = z.object({
  displayName: z.string().min(2),
  username: z.string().min(3),
  bio: z.string().max(200).optional(),
})

type FormValues = z.infer<typeof schema>

export function SettingsProfilePage() {
  const { t } = useTranslation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: mockCurrentUser.displayName,
      username: mockCurrentUser.slug,
      bio: mockCurrentUser.bio ?? '',
    },
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500))
    toast.success(t('settings.profileUpdated'))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{t('settings.profile')}</h1>
      </div>

      {/* Avatar */}
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">AY</span>
            </div>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="font-medium text-sm">{t('settings.avatar')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.avatarHint')}</p>
            <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
              {t('settings.changeAvatar')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account type info */}
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('settings.accountType')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.accountTypeHint')}</p>
          </div>
          <Badge variant="secondary">{t('settings.accountTypeProfessional')}</Badge>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('settings.profileInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>{t('settings.username')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                        <Input {...field} className="pl-7" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.bio')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="resize-none" rows={3} />
                    </FormControl>
                    <FormDescription>{(field.value ?? '').length}/200</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit">{t('settings.saveChanges')}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
