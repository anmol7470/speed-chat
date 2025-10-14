import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { UIMessageWithMetadata } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Copy, ImageIcon, PaperclipIcon, Pencil, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function UserMessage({ message }: { message: UIMessageWithMetadata }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const [isEditing, setIsEditing] = useState(false)
  const [editedParts, setEditedParts] = useState(message.parts)
  const [originalParts] = useState(message.parts)
  const editRef = useRef<HTMLTextAreaElement>(null)

  const displayParts = isEditing ? editedParts : message.parts
  const hasFiles = displayParts.some((part) => part.type === 'file')
  const messageContent = displayParts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedParts(message.parts)
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus()
        editRef.current.select()
      }
    }, 0)
  }

  const handleCancel = () => {
    setEditedParts(originalParts)
    setIsEditing(false)
  }

  const handleRemoveFile = (filename: string | undefined) => {
    if (!filename) return
    setEditedParts((prev) => prev.filter((part) => part.type !== 'file' || part.filename !== filename))
  }

  const handleTextChange = (newText: string) => {
    setEditedParts((prev) => prev.map((part) => (part.type === 'text' ? { ...part, text: newText } : part)))
  }

  const handleSend = () => {
    // TODO: Implement send functionality
  }

  return (
    <div className={cn('group', isEditing ? 'w-full' : 'ml-auto max-w-[85%]')}>
      <div
        className={cn('bg-muted rounded-lg p-2.5 break-words whitespace-pre-wrap', hasFiles && 'flex flex-col gap-2')}
      >
        {displayParts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return isEditing ? (
                <div className="flex flex-col gap-2" key={index}>
                  <Textarea
                    ref={editRef}
                    value={part.text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleCancel()
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="min-h-[60px] w-full resize-none border-0 bg-transparent px-2 shadow-none outline-none focus-visible:ring-0"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSend}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              ) : (
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
                  {isEditing && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(part.filename)
                      }}
                      aria-label="Remove file"
                    >
                      <XIcon className="size-4" aria-hidden="true" />
                    </Button>
                  )}
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
        <Button variant="ghost" size="icon-sm" type="button" onClick={handleEditClick}>
          <Pencil className="size-4" />
          <span className="sr-only">Edit message</span>
        </Button>
      </div>
    </div>
  )
}
