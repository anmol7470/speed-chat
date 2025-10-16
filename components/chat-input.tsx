'use client'

import { useAttachments } from '@/hooks/use-attachments'
import { models } from '@/lib/models'
import { cn } from '@/lib/utils'
import { User } from 'better-auth'
import { ArrowUp, Brain, ChevronDown, Globe, Loader2, Paperclip } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useChatConfig } from './chat-config-provider'
import { useChatContext } from './chat-provider'
import { MemoizedFilePreview } from './file-preview'
import { Button, buttonVariants } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Textarea } from './ui/textarea'
import { Toggle } from './ui/toggle'

export function ChatInput({ user }: { user: User | undefined }) {
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
  } = useChatContext()
  const { config, updateConfig, isLoading } = useChatConfig()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { filesToUpload, setFilesToUpload, handleFileChange, removeFile, isUploading } = useAttachments({
    filesToSend,
    setFilesToSend,
    user,
  })

  const currentModel = models.find((m) => m.id === config.selectedModelId)

  return (
    <form
      className="border-border bg-background mx-auto w-full max-w-3xl rounded-xl border p-2 px-4 shadow-xs sm:px-2"
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
        className="placeholder:text-muted-foreground max-h-[200px] min-h-[80px] w-full resize-none border-0 !bg-transparent px-1 !text-[15px] shadow-none focus-visible:ring-0"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
        placeholder="Ask anything"
        ref={inputRef}
        value={input}
      />
      <div className="flex justify-between px-1 pt-2">
        <div className="flex items-center gap-1">
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
            variant="ghost"
          >
            <Paperclip className="size-5" />
            <span className="sr-only">Attach files</span>
          </Button>
          <input
            accept="image/*, application/pdf"
            className="hidden"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          {!isLoading && (
            <>
              {currentModel?.supportsWebSearchTool && (
                <Toggle
                  pressed={useWebSearch}
                  onPressedChange={(pressed) => setUseWebSearch(pressed)}
                  aria-label="Web search"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    '[&[data-state=on]]:bg-accent [&[data-state=on]]:text-foreground dark:hover:[&[data-state=on]]:bg-accent'
                  )}
                >
                  <Globe className="size-4.5" />
                  Search
                </Toggle>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" suppressHydrationWarning>
                    {currentModel?.name}
                    <ChevronDown className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-xl p-2">
                  <div className="flex flex-col gap-1">
                    {models.map((m) => (
                      <DropdownMenuItem
                        className="flex items-center justify-between gap-2 rounded-lg py-2"
                        key={m.id}
                        onClick={() => updateConfig({ selectedModelId: m.id })}
                      >
                        {m.name}
                        {m.supportsReasoning && <Brain className="size-4" />}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
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
    </form>
  )
}
