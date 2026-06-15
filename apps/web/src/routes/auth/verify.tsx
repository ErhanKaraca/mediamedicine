import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { toast } from 'sonner'

export function VerifyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleVerify = async () => {
    if (otp.length < 6) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsLoading(false)
    toast.success(t('auth.verifySuccess'))
    navigate({ to: '/feed' })
  }

  const handleResend = () => {
    setCountdown(30)
    setCanResend(false)
    toast.success(t('auth.codeResent'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.verifyTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">doktor@hastane.com</span>
            {' '}{t('auth.verifySubtitle')}
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={otp.length < 6 || isLoading}
            >
              {isLoading ? t('auth.verifying') : t('auth.verifyBtn')}
            </Button>
          </div>

          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-primary hover:underline"
              >
                {t('auth.resendCode')}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {countdown} {t('auth.resendIn')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('auth.backToLogin')}
      </Link>
    </div>
  )
}
