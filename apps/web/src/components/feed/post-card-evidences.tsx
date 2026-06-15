import { useTranslation } from 'react-i18next'
import { BookOpenText } from 'lucide-react'
import type { PostEvidence, EvidenceSourceType } from '@/types'
import { normalizeEvidenceSourceType } from '@/lib/evidence-form'

export function PostCardEvidences({ items }: { items?: PostEvidence[] }) {
  const { t } = useTranslation()

  if (!items || items.length === 0) return null

  const sourceLabel = (type: EvidenceSourceType) =>
    t(`evidence.${normalizeEvidenceSourceType(type)}`)

  return (
    <ul className="mt-3 space-y-2">
      {items.map((ev, idx) => (
        <li
          key={idx}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5"
        >
          <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-foreground">
              {ev.title?.trim() ||
                ev.identifierValue?.trim() ||
                ev.url?.trim() ||
                sourceLabel(ev.sourceType)}
            </p>
            <p className="text-base text-muted-foreground">
              {sourceLabel(ev.sourceType)}
              {ev.year != null ? ` · ${ev.year}` : ''}
              {ev.identifierValue && ev.title ? ` · ${ev.identifierValue}` : ''}
            </p>
            {ev.url && (
              <a
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 inline-block truncate text-base text-primary hover:underline"
              >
                {ev.url}
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
