import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostMedia } from '@/types'

interface MediaLightboxProps {
  open: boolean
  items: PostMedia[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}

export function MediaLightbox({ open, items, index, onClose, onIndexChange }: MediaLightboxProps) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange(Math.min(index + 1, items.length - 1))
      if (e.key === 'ArrowLeft') onIndexChange(Math.max(index - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, items.length, onClose, onIndexChange])

  if (!open || items.length === 0) return null
  const current = items[index]
  const isVideo = current.mimeType.startsWith('video/')
  const canPrev = index > 0
  const canNext = index < items.length - 1

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label={t('mediaLightbox.close')}
      >
        <X className="h-6 w-6" />
      </Button>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 px-4 py-2 text-base font-medium text-white">
          {index + 1} / {items.length}
        </div>
      )}

      {canPrev && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange(index - 1)
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label={t('mediaLightbox.previous')}
        >
          <ChevronLeft className="h-7 w-7" />
        </Button>
      )}
      {canNext && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange(index + 1)
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label={t('mediaLightbox.next')}
        >
          <ChevronRight className="h-7 w-7" />
        </Button>
      )}

      <div
        className="max-h-[90vh] max-w-[90vw] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <img
            src={current.url}
            alt={current.altText ?? ''}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        )}
      </div>
    </div>,
    document.body,
  )
}
