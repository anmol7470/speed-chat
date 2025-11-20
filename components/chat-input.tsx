'use client'

import { useAttachments } from '@/hooks/use-attachments'
import { models } from '@/lib/ai/models'
import { cn } from '@/lib/utils'
import { useConvexAuth } from 'convex/react'
import { ArrowUp, ChevronDown, Paperclip } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { MemoizedFilePreview } from './file-preview'
import { useChatConfig } from './providers/chat-config-provider'
import { useChatContext } from './providers/chat-provider'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Textarea } from './ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function ChatInput({
  isDragActive,
  droppedFiles,
  setDroppedFiles,
}: {
  isDragActive: boolean
  droppedFiles: File[]
  setDroppedFiles: React.Dispatch<React.SetStateAction<File[]>>
}) {
  const { isAuthenticated } = useConvexAuth()
  const {
    input,
    inputRef,
    handleInputChange,
    handleSubmit,
    status,
    isStreaming,
    filesToSend,
    setFilesToSend,
    filesToUpload,
    setFilesToUpload,
  } = useChatContext()
  const { config, updateConfig, isLoading } = useChatConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { handleFileChange, removeFile, isUploading, processFilesAndUpload } = useAttachments({
    filesToSend,
    setFilesToSend,
    setFilesToUpload,
  })

  // Process dropped files when they arrive
  useEffect(() => {
    if (droppedFiles.length > 0) {
      processFilesAndUpload(droppedFiles)
      setDroppedFiles([])
    }
  }, [droppedFiles, processFilesAndUpload, setDroppedFiles])

  const currentModel = models.find((m) => m.id === config.selectedModelId)

  return (
    <form
      className={cn(
        'border-border bg-muted/30 dark:bg-input/20 mx-auto w-full max-w-3xl rounded-xl border p-2 px-2 shadow-xs transition-colors',
        isDragActive && 'border-primary'
      )}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(e)
        setFilesToUpload([])
      }}
    >
      {filesToUpload.length > 0 && (
        <MemoizedFilePreview
          filesToSend={filesToSend}
          filesToUpload={filesToUpload}
          isUploading={isUploading}
          removeFile={removeFile}
        />
      )}
      <Textarea
        autoFocus
        className="placeholder:text-muted-foreground max-h-[120px] min-h-[60px] w-full resize-none border-0 bg-transparent! px-1 text-[15px]! shadow-none focus-visible:ring-0"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
        placeholder="Ask anything..."
        ref={inputRef}
        value={input}
      />
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (isAuthenticated) {
                    fileInputRef.current?.click()
                  } else {
                    toast.error('Please sign in to attach files')
                  }
                }}
                size="icon-sm"
                type="button"
                variant="outline"
                className="rounded-full font-normal"
              >
                <Paperclip className="size-5" />
                <span className="sr-only">Attach files</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach files</p>
            </TooltipContent>
          </Tooltip>
          <input
            accept="image/*, application/pdf"
            className="hidden"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
        </div>
        <div className="flex items-center gap-1">
          {!isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="font-normal" suppressHydrationWarning>
                  {currentModel?.name}
                  <ChevronDown className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit rounded-xl p-2" align="end">
                <div className="flex flex-col gap-1">
                  {models.map((m) => (
                    <DropdownMenuItem
                      className="flex items-center justify-between gap-2 rounded-lg"
                      key={m.id}
                      onClick={() => updateConfig({ selectedModelId: m.id })}
                    >
                      {m.name}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            className="rounded-full"
            disabled={(status === 'ready' && !input.trim()) || isStreaming}
            size="icon-sm"
            type="submit"
          >
            <ArrowUp className="size-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
