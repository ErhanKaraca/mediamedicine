import { ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { LinkPreview } from '@/types'

export function PostCardLinkPreview({ data }: { data: LinkPreview }) {
  return (
    <Card className="relative mt-3 overflow-hidden py-0 shadow-none transition-colors hover:bg-accent/50">
      <ExternalLink className="absolute right-2 top-2 z-10 h-3.5 w-3.5 text-muted-foreground" />
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex overflow-hidden rounded-lg border-0 bg-transparent text-left no-underline"
      >
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt=""
            className="h-[110px] w-[140px] shrink-0 object-cover"
          />
        )}
        <div className="flex min-w-0 flex-col justify-center gap-1 px-4 py-3">
          {data.title && (
            <p className="truncate text-base font-semibold text-foreground">{data.title}</p>
          )}
          {data.description && (
            <p className="line-clamp-2 text-base text-muted-foreground">{data.description}</p>
          )}
          <p className="truncate text-base text-muted-foreground/70">
            {data.siteName ?? new URL(data.url).hostname.replace(/^www\./, '')}
          </p>
        </div>
      </a>
    </Card>
  )
}
