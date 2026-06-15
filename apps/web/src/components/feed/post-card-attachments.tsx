import { FileText, FileSpreadsheet, File as FileIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostAttachment } from '@/types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime: string) {
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv')
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
  if (mime.includes('pdf'))
    return <FileText className="h-4 w-4 shrink-0 text-rose-600" />
  if (mime.includes('word') || mime === 'text/plain')
    return <FileText className="h-4 w-4 shrink-0 text-blue-600" />
  return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
}

export function PostCardAttachments({ attachments }: { attachments?: PostAttachment[] }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {attachments.map((a) => (
        <Button
          key={a.id}
          variant="outline"
          size="sm"
          className="h-auto w-full justify-start gap-2 px-4 py-3 font-normal"
          asChild
        >
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {fileIcon(a.mimeType)}
            <span className="min-w-0 flex-1 truncate text-left text-base text-foreground">
              {a.originalName}
            </span>
            <span className="shrink-0 text-base text-muted-foreground">{formatBytes(a.fileSize)}</span>
            <Download className="h-5 w-5 shrink-0 text-muted-foreground" />
          </a>
        </Button>
      ))}
    </div>
  )
}
