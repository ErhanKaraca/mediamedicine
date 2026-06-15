import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpenText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Globe,
  UserRound,
  Users2,
  Lock,
  Stethoscope,
  EyeOff,
  MessageCircle,
  Palette,
  X,
  Plus,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { MmRichEditor } from '@/components/composer/mm-rich-editor'
import { mockCurrentUser } from '@/lib/mock-data'
import type { ComposerBg, PostEvidence, PostVisibility } from '@/types'
import {
  COMPOSER_EVIDENCE_TYPES,
  EVIDENCE_FORM_CONFIG,
  normalizeEvidenceSourceType,
  validateEvidenceForm,
  type ComposerEvidenceType,
  type EvidenceFieldId,
} from '@/lib/evidence-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CHAR_LIMIT = 12_000
const WARN_THRESHOLD = 11_500
const MAX_MEDIA = 4
const MAX_FILES = 4
const MAX_EVIDENCES = 5

type ReplyPolicy = 'everyone' | 'followers' | 'mentions'

const VISIBILITY_OPTIONS: {
  value: PostVisibility | 'mutual' | 'professionals_only' | 'unlisted' | 'private'
  labelKey: `composer.visibility.${string}`
  icon: typeof Globe
}[] = [
  { value: 'public', labelKey: 'composer.visibility.public', icon: Globe },
  { value: 'followers', labelKey: 'composer.visibility.followers', icon: UserRound },
  { value: 'mutual', labelKey: 'composer.visibility.mutual', icon: Users2 },
  { value: 'group', labelKey: 'composer.visibility.group', icon: Lock },
  { value: 'professionals_only', labelKey: 'composer.visibility.professionals_only', icon: Stethoscope },
  { value: 'unlisted', labelKey: 'composer.visibility.unlisted', icon: EyeOff },
  { value: 'private', labelKey: 'composer.visibility.private', icon: EyeOff },
]

const REPLY_POLICY_OPTIONS: { value: ReplyPolicy; labelKey: `composer.replyPolicy.${ReplyPolicy}` }[] = [
  { value: 'everyone', labelKey: 'composer.replyPolicy.everyone' },
  { value: 'followers', labelKey: 'composer.replyPolicy.followers' },
  { value: 'mentions', labelKey: 'composer.replyPolicy.mentions' },
]

const BG_PRESETS: { value: ComposerBg; label: string; preview: string }[] = [
  { value: 'none', label: 'Yok', preview: 'bg-background border-2 border-border' },
  { value: 'mist', label: 'Sis', preview: 'composer-surface-mist' },
  { value: 'dawn', label: 'Şafak', preview: 'composer-surface-dawn' },
  { value: 'lavender', label: 'Lavanta', preview: 'composer-surface-lavender' },
  { value: 'paper', label: 'Kağıt', preview: 'composer-surface-paper' },
]

function EvidenceDialog({
  open,
  onClose,
  onAdd,
  existing,
}: {
  open: boolean
  onClose: () => void
  onAdd: (ev: PostEvidence) => void
  existing: PostEvidence[]
}) {
  const { t } = useTranslation()
  const [sourceType, setSourceType] = useState<ComposerEvidenceType>('publication')
  const [title, setTitle] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [url, setUrl] = useState('')
  const [year, setYear] = useState('')

  const formConfig = EVIDENCE_FORM_CONFIG[sourceType] ?? EVIDENCE_FORM_CONFIG.publication

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    const allowed = new Set(EVIDENCE_FORM_CONFIG[sourceType].fields)
    if (!allowed.has('title')) setTitle('')
    if (!allowed.has('identifier')) setIdentifier('')
    if (!allowed.has('url')) setUrl('')
    if (!allowed.has('year')) setYear('')
  }, [sourceType])

  if (!open) return null

  function reset() {
    setSourceType('publication')
    setTitle('')
    setIdentifier('')
    setUrl('')
    setYear('')
  }

  function handleAdd() {
    const validation = validateEvidenceForm(sourceType, { title, identifier, url, year })
    if (validation === 'required') {
      toast.error(t('composer.evidence.validationRequired'))
      return
    }
    if (validation === 'anyOf') {
      toast.error(t('composer.evidence.validationAnyOf'))
      return
    }

    onAdd({
      title: title.trim() || undefined,
      sourceType,
      identifierValue: identifier.trim() || undefined,
      url: url.trim() || undefined,
      year: year ? Number(year) : undefined,
    })
    reset()
  }

  const showField = (field: EvidenceFieldId) => formConfig.fields.includes(field)
  const isRequired = (field: EvidenceFieldId) => formConfig.required.includes(field)

  const identifierPlaceholderKey = `composer.evidence.identifierPlaceholder.${sourceType}` as const
  const hasIdentifierPlaceholder = sourceType in { publication: 1, clinical_guideline: 1, book: 1, other: 1 }

  const fieldLabel = (field: EvidenceFieldId) => {
    const keys: Record<EvidenceFieldId, string> = {
      title: 'composer.evidence.fieldTitle',
      identifier: 'composer.evidence.fieldIdentifier',
      url: 'composer.evidence.fieldUrl',
      year: 'composer.evidence.fieldYear',
    }
    return t(keys[field])
  }

  const requiredMark = (field: EvidenceFieldId) =>
    isRequired(field) ? <span className="text-destructive"> *</span> : null

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-background/40 backdrop-blur-lg p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-dialog-title"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-popover/95 shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h3 id="evidence-dialog-title" className="text-lg font-bold tracking-tight">
              {t('composer.evidence.dialogTitle')}
            </h3>
            <p className="mt-0.5 text-base text-muted-foreground">
              {t('composer.evidence.dialogSubtitle')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 pb-3">
          <div>
            <label className="mb-1.5 block text-base font-medium">
              {t('composer.evidence.sourceType')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMPOSER_EVIDENCE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  className={cn(
                    'rounded-full border-0 px-3 py-1.5 text-base font-medium transition-colors',
                    sourceType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {t(`evidence.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {showField('title') && (
            <div>
              <label className="mb-1.5 block text-base font-medium">
                {fieldLabel('title')}
                {requiredMark('title')}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(`composer.evidence.titlePlaceholder.${sourceType}`)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}

          {showField('identifier') && (
            <div>
              <label className="mb-1.5 block text-base font-medium">
                {fieldLabel('identifier')}
                {requiredMark('identifier')}
              </label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  hasIdentifierPlaceholder
                    ? t(identifierPlaceholderKey)
                    : t('composer.evidence.identifierPlaceholder.other')
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}

          {showField('url') && (
            <div>
              <label className="mb-1.5 block text-base font-medium">
                {fieldLabel('url')}
                {requiredMark('url')}
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('composer.evidence.urlPlaceholder')}
                type="url"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}

          {showField('year') && (
            <div>
              <label className="mb-1.5 block text-base font-medium">
                {fieldLabel('year')}
                {requiredMark('year')}
              </label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={t('composer.evidence.yearPlaceholder')}
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                className="w-32 rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <p className="text-base text-muted-foreground">
            {t('composer.evidence.addedCount', { count: existing.length, max: MAX_EVIDENCES })}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={existing.length >= MAX_EVIDENCES}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t('composer.evidence.addSource')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

type MediaItem = { id: string; file: File; previewUrl: string; isVideo: boolean }
type FileItem = { id: string; file: File }

function newId() {
  return Math.random().toString(36).slice(2)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PostComposerProps {
  className?: string
  onPost?: () => void
}

export function PostComposer({ className, onPost }: PostComposerProps) {
  const { t } = useTranslation()
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [visibility, setVisibility] = useState<
    PostVisibility | 'mutual' | 'professionals_only' | 'unlisted' | 'private'
  >('public')
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>('everyone')
  const [bg, setBg] = useState<ComposerBg>('none')
  const [bgOpen, setBgOpen] = useState(false)

  const [plainText, setPlainText] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [evidences, setEvidences] = useState<PostEvidence[]>([])
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  useEffect(() => {
    return () => {
      media.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    }
  }, [media])

  const charCount = plainText.length
  const overLimit = charCount > CHAR_LIMIT
  const nearLimit = charCount >= WARN_THRESHOLD
  const isEmpty =
    charCount === 0 && media.length === 0 && files.length === 0 && evidences.length === 0
  const mediaFull = media.length >= MAX_MEDIA
  const filesFull = files.length >= MAX_FILES

  const visibilityOptions = VISIBILITY_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey),
  }))
  const replyPolicyOptions = REPLY_POLICY_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey),
  }))

  const currentVisibility =
    visibilityOptions.find((v) => v.value === visibility) ?? visibilityOptions[0]
  const VisIcon = currentVisibility.icon

  function handleAddMedia(fileList: FileList | null) {
    if (!fileList) return
    const remaining = MAX_MEDIA - media.length
    const arr = Array.from(fileList).slice(0, remaining)
    const newItems: MediaItem[] = arr.map((f) => ({
      id: newId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
    }))
    setMedia((prev) => [...prev, ...newItems])
  }

  function handleAddFiles(fileList: FileList | null) {
    if (!fileList) return
    const remaining = MAX_FILES - files.length
    const arr = Array.from(fileList).slice(0, remaining)
    setFiles((prev) => [...prev, ...arr.map((f) => ({ id: newId(), file: f }))])
  }

  function removeMedia(id: string) {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((m) => m.id !== id)
    })
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  function handlePost() {
    if (isEmpty || overLimit) return
    toast.success(t('post.postedToast'))
    setPlainText('')
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    setMedia([])
    setFiles([])
    setEvidences([])
    setBg('none')
    onPost?.()
  }

  const bgClass = bg !== 'none' ? `composer-surface-${bg}` : ''

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <ProfileAvatar profile={mockCurrentUser} size="lg" showVerified={false} />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Editor surface */}
            <div className={cn('relative rounded-xl px-4 pt-4 pb-2', bgClass)}>
              {bg !== 'none' && (
                <span className="absolute right-2 top-2 rounded-full bg-background/50 px-2 py-0.5 text-sm font-medium text-foreground/70 backdrop-blur-sm">
                  {BG_PRESETS.find((p) => p.value === bg)?.label}
                </span>
              )}
              <MmRichEditor
                placeholder={t('post.composerPlaceholder')}
                minHeight={80}
                showToolbar={false}
                onPlainTextChange={setPlainText}
              />
            </div>

            {/* Media preview grid */}
            {media.length > 0 && (
              <div
                className={cn(
                  'mt-3 grid gap-2 overflow-hidden rounded-xl',
                  media.length === 1 && 'grid-cols-1',
                  media.length === 2 && 'grid-cols-2',
                  media.length >= 3 && 'grid-cols-2',
                )}
              >
                {media.map((m) => (
                  <div
                    key={m.id}
                    className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {m.isVideo ? (
                      <video src={m.previewUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedia(m.id)}
                      className="absolute top-1.5 right-1.5 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label={t('composer.remove')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* File attachments list */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <Paperclip className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-base">{f.file.name}</span>
                    <span className="shrink-0 text-base text-muted-foreground">
                      {formatBytes(f.file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(f.id)}
                      aria-label={t('composer.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Evidences list */}
            {evidences.length > 0 && (
              <ul className="mt-3 space-y-2">
                {evidences.map((ev, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5"
                  >
                    <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium">
                        {ev.title || ev.identifierValue || ev.url || t('composer.evidence.fallbackLabel')}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {t(`evidence.${normalizeEvidenceSourceType(ev.sourceType)}`)}
                        {ev.year ? ` · ${ev.year}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setEvidences((list) => list.filter((_, i) => i !== idx))}
                      aria-label={t('composer.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Hidden inputs */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                handleAddMedia(e.target.files)
                e.target.value = ''
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt"
              className="sr-only"
              onChange={(e) => {
                handleAddFiles(e.target.files)
                e.target.value = ''
              }}
            />

            {/* Bottom toolbar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={mediaFull}
                  onClick={() => mediaInputRef.current?.click()}
                  className={cn(
                    'h-9 w-9 rounded-full',
                    media.length > 0
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    mediaFull && 'opacity-40',
                  )}
                  aria-label={t('composer.addMedia')}
                  title={t('composer.addMedia')}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={filesFull}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'h-9 w-9 rounded-full',
                    files.length > 0
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    filesFull && 'opacity-40',
                  )}
                  aria-label={t('composer.addAttachment')}
                  title={t('composer.addAttachmentTitle')}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEvidenceOpen(true)}
                  disabled={evidences.length >= MAX_EVIDENCES}
                  className={cn(
                    'h-9 w-9 rounded-full',
                    evidences.length > 0
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    evidences.length >= MAX_EVIDENCES && 'opacity-40',
                  )}
                  aria-label={t('composer.addEvidence')}
                  title="Bilimsel kaynak ekle"
                >
                  <BookOpenText className="h-5 w-5" />
                </Button>

                <DropdownMenu open={bgOpen} onOpenChange={setBgOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-9 w-9 rounded-full',
                        bg !== 'none'
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      aria-label="Arka plan"
                      title="Arka plan"
                    >
                      <Palette className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-base font-semibold text-muted-foreground">
                      Arka plan
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-5 gap-2 p-2">
                      {BG_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            setBg(p.value)
                            setBgOpen(false)
                          }}
                          className={cn(
                            'h-10 w-10 rounded-full transition-transform',
                            p.preview,
                            bg === p.value && 'ring-2 ring-primary scale-110',
                          )}
                          title={p.label}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <span className="mx-1 h-5 w-px bg-border" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 rounded-full px-2.5 text-base text-muted-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {replyPolicyOptions.find((r) => r.value === replyPolicy)?.label}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel className="text-base font-semibold text-muted-foreground">
                      {t('composer.replyPolicyLabel')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {replyPolicyOptions.map((r) => (
                      <DropdownMenuCheckboxItem
                        key={r.value}
                        checked={replyPolicy === r.value}
                        onCheckedChange={() => setReplyPolicy(r.value)}
                      >
                        {r.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 rounded-full px-2.5 text-base text-muted-foreground"
                    >
                      <VisIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{currentVisibility.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel className="text-base font-semibold text-muted-foreground">
                      {t('composer.visibilityLabel')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {visibilityOptions.map((v) => {
                      const Icon = v.icon
                      return (
                        <DropdownMenuCheckboxItem
                          key={v.value}
                          checked={visibility === v.value}
                          onCheckedChange={() => setVisibility(v.value)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {v.label}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                {charCount > 0 && (
                  <span
                    className={cn(
                      'text-base tabular-nums',
                      overLimit
                        ? 'font-semibold text-destructive'
                        : nearLimit
                          ? 'text-amber-600'
                          : 'text-muted-foreground',
                    )}
                  >
                    {charCount}/{CHAR_LIMIT.toLocaleString()}
                  </span>
                )}
                <Button
                  type="button"
                  className="rounded-full px-6 font-semibold"
                  disabled={isEmpty || overLimit}
                  onClick={handlePost}
                >
                  {t('post.postButton')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EvidenceDialog
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        existing={evidences}
        onAdd={(ev) => {
          setEvidences((list) => [...list, ev])
          if (evidences.length + 1 >= MAX_EVIDENCES) setEvidenceOpen(false)
        }}
      />
    </Card>
  )
}
