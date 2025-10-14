import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { UIMessageWithMetadata } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Copy, ImageIcon, PaperclipIcon, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './ui/button'

type UserMessageProps = {
  allMessages: UIMessageWithMetadata[]
  message: UIMessageWithMetadata
}

export function UserMessage({ allMessages, message }: UserMessageProps) {
  const hasFiles = message.parts.some((part) => part.type === 'file')
  const messageContent = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')

  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(messageContent)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const originalMessagesRef = useRef<UIMessageWithMetadata[]>(allMessages)
  const [removedFileUrls, setRemovedFileUrls] = useState<string[]>([])

  return (
    <div className="group ml-auto max-w-[85%]">
      <div
        className={cn('bg-muted rounded-lg p-2.5 break-words whitespace-pre-wrap', hasFiles && 'flex flex-col gap-2')}
      >
        {message.parts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return (
                <div className="px-2" key={index}>
                  {part.text}
                </div>
              )
            case 'file':
              return (
                <div
                  key={part.filename}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-2"
                  onClick={() => {
                    window.open(part.url, '_blank')
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {part.mediaType.startsWith('image/') ? (
                      <ImageIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                    ) : (
                      <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{part.filename}</p>
                    </div>
                  </div>
                </div>
              )
          }
        })}
      </div>
      <div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={() => {
            copyToClipboard(messageContent)
          }}
        >
          {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span className="sr-only">Copy message</span>
        </Button>
        <Button variant="ghost" size="icon-sm" type="button">
          <Pencil className="size-4" />
          <span className="sr-only">Edit message</span>
        </Button>
      </div>
    </div>
  )
}
