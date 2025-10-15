'use client'

import { useAttachments } from '@/hooks/use-attachments'
import { models } from '@/lib/ai/models'
import { cn } from '@/lib/utils'
import { User } from 'better-auth'
import { ArrowUp, Check, ChevronDown, Globe, Paperclip, Square } from 'lucide-react'
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
  const { input, setInput, handleSubmit, status, isStreaming, stop, filesToSend, setFilesToSend } = useChatContext()
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

  return (
    <form
      className="bg-muted mx-auto w-full max-w-3xl shrink-0 rounded-xl p-2 px-4 sm:px-2"
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
            variant="outline"
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
              <Toggle
                pressed={config.shouldWebSearch}
                onPressedChange={(pressed) => updateConfig({ shouldWebSearch: pressed })}
                aria-label="Web search"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  '[&[data-state=on]]:bg-primary [&[data-state=on]]:text-accent dark:hover:[&[data-state=on]]:bg-primary'
                )}
              >
                <Globe className="size-4.5" />
                Search
              </Toggle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" suppressHydrationWarning>
                    {config.selectedModel}
                    <ChevronDown className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-fit rounded-xl p-2">
                  <div className="flex flex-col gap-1">
                    {models
                      .sort((a, b) => a.id.split('/')[0].localeCompare(b.id.split('/')[0]))
                      .map((m) => (
                        <DropdownMenuItem
                          className="flex items-center justify-between gap-2 rounded-lg py-2"
                          key={m.name}
                          onClick={() => updateConfig({ selectedModel: m.name })}
                        >
                          <div className="flex items-center gap-2">{m.name}</div>
                          {m.name === config.selectedModel && <Check className="size-4" />}
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
          disabled={status === 'ready' && !input.trim()}
          onClick={() => {
            if (isStreaming) {
              stop()
            }
          }}
          size="icon-sm"
          type="submit"
        >
          {isStreaming ? <Square className="size-5" /> : <ArrowUp className="size-5" />}
          <span className="sr-only">{isStreaming ? 'Stop' : 'Send message'}</span>
        </Button>
      </div>
    </form>
  )
}
