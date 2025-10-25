'use client'

import { useAttachments } from '@/hooks/use-attachments'
import { models } from '@/lib/models'
import { cn } from '@/lib/utils'
import { ArrowUp, Brain, ChevronDown, Globe, Loader2, Paperclip } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { MemoizedFilePreview } from './file-preview'
import { useChatConfig } from './providers/chat-config-provider'
import { useChatContext } from './providers/chat-provider'
import { useUser } from './providers/user-provider'
import { Button, buttonVariants } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Textarea } from './ui/textarea'
import { Toggle } from './ui/toggle'
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
  const { user } = useUser()
  const {
    input,
    setInput,
    handleSubmit,
    status,
    isStreaming,
    filesToSend,
    setFilesToSend,
    useWebSearch,
    setUseWebSearch,
    useReasoning,
    setUseReasoning,
  } = useChatContext()
  const { config, updateConfig, isLoading } = useChatConfig()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { filesToUpload, setFilesToUpload, handleFileChange, removeFile, isUploading, processFilesAndUpload } =
    useAttachments({
      filesToSend,
      setFilesToSend,
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
        'border-border bg-input/30 mx-auto w-full max-w-3xl rounded-xl border p-2 px-4 shadow-xs transition-colors sm:px-2',
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
        className="placeholder:text-muted-foreground max-h-[120px] min-h-[60px] w-full resize-none border-0 !bg-transparent px-1 !text-[15px] shadow-none focus-visible:ring-0"
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
                  if (user) {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  pressed={useWebSearch}
                  onPressedChange={(pressed) => setUseWebSearch(pressed)}
                  aria-label="Search"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    '[&[data-state=on]]:bg-primary/5 hover:[&[data-state=on]]:bg-primary/5 [&[data-state=on]]:text-foreground dark:[&[data-state=on]]:bg-input dark:hover:[&[data-state=on]]:bg-input rounded-full'
                  )}
                >
                  <Globe className="size-4.5" />
                  <span className="hidden md:block">Search</span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{useWebSearch ? 'Disable' : 'Enable'} web search</p>
            </TooltipContent>
          </Tooltip>
          {!isLoading && currentModel?.reasoningConfigurable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Toggle
                    pressed={useReasoning}
                    onPressedChange={(pressed) => setUseReasoning(pressed)}
                    aria-label="Reasoning"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      '[&[data-state=on]]:bg-primary/5 hover:[&[data-state=on]]:bg-primary/5 [&[data-state=on]]:text-foreground dark:[&[data-state=on]]:bg-input dark:hover:[&[data-state=on]]:bg-input rounded-full'
                    )}
                  >
                    <Brain className="size-4.5" />
                    <span className="hidden md:block">Reasoning</span>
                  </Toggle>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{useReasoning ? 'Disable' : 'Enable'} reasoning</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full" suppressHydrationWarning>
                  {currentModel?.name}
                  <ChevronDown className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-xl p-2" align="end">
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
            {isStreaming ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
