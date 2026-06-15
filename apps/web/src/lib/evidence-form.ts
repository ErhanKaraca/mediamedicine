import type { EvidenceSourceType } from '@/types'

/** Source types available in the post composer (excludes legacy / non-form types). */
export type ComposerEvidenceType = Exclude<
  EvidenceSourceType,
  'own_experience' | 'media_asset'
>

export const COMPOSER_EVIDENCE_TYPES: ComposerEvidenceType[] = [
  'publication',
  'clinical_guideline',
  'book',
  'news_article',
  'external_url',
  'own_opinion',
  'other',
]

export type EvidenceFieldId = 'title' | 'identifier' | 'url' | 'year'

export interface EvidenceFormValues {
  title: string
  identifier: string
  url: string
  year: string
}

export interface EvidenceFormConfig {
  fields: EvidenceFieldId[]
  required: EvidenceFieldId[]
  /** At least one of these must be non-empty when set. */
  requireAnyOf?: EvidenceFieldId[]
}

export const EVIDENCE_FORM_CONFIG: Record<ComposerEvidenceType, EvidenceFormConfig> = {
  publication: {
    fields: ['title', 'identifier', 'url', 'year'],
    required: [],
    requireAnyOf: ['title', 'identifier', 'url'],
  },
  clinical_guideline: {
    fields: ['title', 'identifier', 'url', 'year'],
    required: [],
    requireAnyOf: ['title', 'identifier', 'url'],
  },
  book: {
    fields: ['title', 'identifier', 'year', 'url'],
    required: [],
    requireAnyOf: ['title', 'identifier'],
  },
  news_article: {
    fields: ['title', 'url', 'year'],
    required: ['url'],
  },
  external_url: {
    fields: ['url', 'title'],
    required: ['url'],
  },
  own_opinion: {
    fields: ['title'],
    required: ['title'],
  },
  other: {
    fields: ['title', 'identifier', 'url', 'year'],
    required: [],
    requireAnyOf: ['title', 'identifier', 'url'],
  },
}

export function normalizeEvidenceSourceType(type: EvidenceSourceType): EvidenceSourceType {
  return type === 'own_experience' ? 'own_opinion' : type
}

export function isComposerEvidenceType(type: EvidenceSourceType): type is ComposerEvidenceType {
  return (COMPOSER_EVIDENCE_TYPES as EvidenceSourceType[]).includes(type)
}

export function validateEvidenceForm(
  sourceType: ComposerEvidenceType,
  values: EvidenceFormValues,
): 'ok' | 'required' | 'anyOf' {
  const config = EVIDENCE_FORM_CONFIG[sourceType]
  if (!config) return 'anyOf'

  const trimmed = {
    title: values.title.trim(),
    identifier: values.identifier.trim(),
    url: values.url.trim(),
    year: values.year.trim(),
  }

  for (const field of config.required ?? []) {
    if (!trimmed[field]) return 'required'
  }

  if (config.requireAnyOf?.length) {
    const hasAny = config.requireAnyOf.some((field) => Boolean(trimmed[field]))
    if (!hasAny) return 'anyOf'
  }

  return 'ok'
}
