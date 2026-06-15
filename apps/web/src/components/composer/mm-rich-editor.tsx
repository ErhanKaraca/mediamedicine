import { useCallback, useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { HashtagNode } from '@lexical/hashtag'
import { LinkNode } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  EditorState,
} from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const theme = {
  heading: {
    h1: 'text-2xl font-bold mb-2',
    h2: 'text-xl font-semibold mb-2',
    h3: 'text-lg font-medium mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono bg-muted px-1 rounded text-sm',
  },
  list: {
    ul: 'list-disc list-inside ml-4 my-2 space-y-1',
    ol: 'list-decimal list-inside ml-4 my-2 space-y-1',
    listitem: 'text-foreground',
  },
  hashtag: 'text-primary font-medium cursor-pointer hover:underline',
  link: 'text-primary underline cursor-pointer',
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }, [editor])

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
  }, [editor])

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
  }, [editor])

  const insertUnorderedList = useCallback(() => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  }, [editor])

  const insertOrderedList = useCallback(() => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
  }, [editor])

  return (
    <div className="flex items-center gap-1 border-b border-border pb-2 mb-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={formatBold}
        title="Kalın"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={formatItalic}
        title="İtalik"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={formatUnderline}
        title="Altı çizili"
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={insertUnorderedList}
        title="Madde listesi"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={insertOrderedList}
        title="Numaralı liste"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

interface MmRichEditorProps {
  placeholder?: string
  minHeight?: number
  showToolbar?: boolean
  onPlainTextChange?: (text: string) => void
  onStateChange?: (state: EditorState) => void
  className?: string
}

export function MmRichEditor({
  placeholder = 'What do you want to share with the medical world?',
  minHeight = 120,
  showToolbar = true,
  onPlainTextChange,
  onStateChange,
  className,
}: MmRichEditorProps) {
  const initialConfig = {
    namespace: 'MmEditor',
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, HashtagNode, LinkNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onStateChange?.(editorState)
      editorState.read(() => {
        if (onPlainTextChange) {
          const root = editorState._nodeMap
          let text = ''
          root.forEach((node) => {
            if ('__text' in node) {
              text += (node as { __text: string }).__text + ' '
            }
          })
          onPlainTextChange(text.trim())
        }
      })
    },
    [onStateChange, onPlainTextChange]
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('composer-content-surface relative', className)}>
        {showToolbar && <ToolbarPlugin />}
        <div className="relative" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none text-sm leading-relaxed text-foreground"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div
                className="absolute top-0 left-0 text-sm text-muted-foreground pointer-events-none"
                style={{ minHeight }}
              >
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <HashtagPlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </div>
    </LexicalComposer>
  )
}
