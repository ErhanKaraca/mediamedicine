import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PostMedia } from '@/types'

interface PostCardMediaGridProps {
  media: PostMedia[]
  onOpen?: (index: number) => void
}

function getVideoAspectRatio(item: PostMedia): string {
  if (item.width && item.height && item.height > 0) {
    return `${item.width} / ${item.height}`
  }
  return '16 / 9'
}

function MediaFrame({
  item,
  maxHeight,
  className,
  children,
}: {
  item: PostMedia
  maxHeight: number
  className?: string
  children: ReactNode
}) {
  const isVideo = item.mimeType.startsWith('video/')

  if (isVideo) {
    const frameStyle: CSSProperties = {
      aspectRatio: getVideoAspectRatio(item),
      maxHeight,
    }

    return (
      <div className={cn('relative mx-auto w-full max-w-full bg-black', className)} style={frameStyle}>
        <div className="absolute inset-0">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full bg-muted', className)} style={{ height: maxHeight }}>
      {children}
    </div>
  )
}

function VideoTile({
  item,
  className,
}: {
  item: PostMedia
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPlaying(true)
    requestAnimationFrame(() => {
      void videoRef.current?.play()
    })
  }

  return (
    <div
      className={cn(
        'relative block h-full w-full overflow-hidden bg-black',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={videoRef}
        src={item.url}
        controls={playing}
        playsInline
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 block h-full w-full object-contain align-bottom bg-black"
      />
      {!playing && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/25" />
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Videoyu oynat"
            className="absolute inset-0 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition-transform hover:scale-105">
              <Play className="ml-0.5 h-7 w-7 fill-current" />
            </span>
          </button>
        </>
      )}
    </div>
  )
}

function MediaTile({
  item,
  index,
  onOpen,
  className,
}: {
  item: PostMedia
  index: number
  onOpen?: (i: number) => void
  className?: string
}) {
  const isVideo = item.mimeType.startsWith('video/')

  if (isVideo) {
    return <VideoTile item={item} className={className} />
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.(index)
      }}
      className={cn(
        'group relative block h-full w-full overflow-hidden bg-muted p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <img
        src={item.url}
        alt={item.altText ?? ''}
        loading="lazy"
        className="absolute inset-0 block h-full w-full object-cover align-bottom transition-transform duration-200 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
    </button>
  )
}

export function PostCardMediaGrid({ media, onOpen }: PostCardMediaGridProps) {
  if (!media || media.length === 0) return null
  const count = media.length

  if (count === 1) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-border">
        <MediaFrame item={media[0]} maxHeight={420}>
          <MediaTile item={media[0]} index={0} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
      </div>
    )
  }
  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-border">
        <MediaFrame item={media[0]} maxHeight={280}>
          <MediaTile item={media[0]} index={0} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
        <MediaFrame item={media[1]} maxHeight={280}>
          <MediaTile item={media[1]} index={1} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
      </div>
    )
  }
  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-border h-[320px]">
        <MediaFrame item={media[0]} maxHeight={320} className="row-span-2 h-full">
          <MediaTile item={media[0]} index={0} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
        <MediaFrame item={media[1]} maxHeight={160} className="h-full">
          <MediaTile item={media[1]} index={1} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
        <MediaFrame item={media[2]} maxHeight={160} className="h-full">
          <MediaTile item={media[2]} index={2} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
      </div>
    )
  }
  return (
    <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-border h-[320px]">
      {media.slice(0, 4).map((m, i) => (
        <MediaFrame key={m.id} item={m} maxHeight={160} className="h-full">
          <MediaTile item={m} index={i} onOpen={onOpen} className="h-full w-full" />
        </MediaFrame>
      ))}
    </div>
  )
}
