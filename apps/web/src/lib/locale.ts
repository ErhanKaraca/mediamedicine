import { enUS, tr } from 'date-fns/locale'

export function isTurkishLanguage(language?: string | null): boolean {
  return language?.startsWith('tr') ?? false
}

export function getDateFnsLocale(language?: string | null) {
  return isTurkishLanguage(language) ? tr : enUS
}

export function getIntlLocale(language?: string | null): string {
  return isTurkishLanguage(language) ? 'tr-TR' : 'en-US'
}

export function getDocumentLanguage(language?: string | null): string {
  return isTurkishLanguage(language) ? 'tr' : 'en'
}
