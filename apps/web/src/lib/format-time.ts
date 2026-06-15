import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  isThisYear,
} from 'date-fns'
import i18n from '@/lib/i18n'
import { getDateFnsLocale, isTurkishLanguage } from '@/lib/locale'

/** Twitter/X-style compact timestamp: 5m / 5dk, 3h / 3sa, Jun 15 / 15 Haz */
export function formatShortRelativeTime(date: Date | string, now = new Date()): string {
  const d = date instanceof Date ? date : new Date(date)
  const isTr = isTurkishLanguage(i18n.language)
  const seconds = differenceInSeconds(now, d)

  if (seconds < 60) return `${Math.max(1, seconds)}${isTr ? 'sn' : 's'}`

  const minutes = differenceInMinutes(now, d)
  if (minutes < 60) return `${minutes}${isTr ? 'dk' : 'm'}`

  const hours = differenceInHours(now, d)
  if (hours < 24) return `${hours}${isTr ? 'sa' : 'h'}`

  const days = differenceInDays(now, d)
  if (days < 7) return `${days}${isTr ? 'g' : 'd'}`

  const locale = getDateFnsLocale()

  if (isThisYear(d)) return format(d, 'd MMM', { locale })

  return format(d, 'd MMM yyyy', { locale })
}
