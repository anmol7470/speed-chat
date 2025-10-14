'use client'

import { useAttachments } from '@/hooks/use-attachments'
import { models } from '@/lib/ai/models'
import { UIMessageWithMetadata } from '@/lib/types'
import { UseChatHelpers } from '@ai-sdk/react'
import { FileUIPart } from 'ai'
import { User } from 'better-auth'
import { ArrowUp, Check, ChevronDown, Paperclip, Square } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useChatConfig } from './chat-config-provider'
import { MemoizedFilePreview } from './file-preview'
import { Button, buttonVariants } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'

type ChatInputProps = {
  user: User | undefined
  input: string
  setInput: (input: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  status: UseChatHelpers<UIMessageWithMetadata>['status']
  isStreaming: boolean
  stop: UseChatHelpers<UIMessageWithMetadata>['stop']
  filesToSend: FileUIPart[]
  setFilesToSend: React.Dispatch<React.SetStateAction<FileUIPart[]>>
}

export function ChatInput({
  user,
  input,
  setInput,
  handleSubmit,
  status,
  isStreaming,
  stop,
  filesToSend,
  setFilesToSend,
}: ChatInputProps) {
  const { config, updateConfig } = useChatConfig()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { filesToUpload, handleFileChange, removeFile, isUploading } = useAttachments({
    filesToSend,
    setFilesToSend,
    user,
  })

  return (
    <form
      className="mx-auto w-full max-w-3xl shrink-0 rounded-xl bg-[#F5F5F5] p-2 px-4 sm:px-2 dark:bg-[#262626]"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(e)
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
        placeholder="Send a message"
        ref={inputRef}
        value={input}
      />
      <div className="flex justify-between px-1 pt-2">
        <div className="flex items-center gap-2">
          <Button
            className="rounded-full"
            onClick={() => {
              if (user) {
                fileInputRef.current?.click()
              } else {
                toast.error('Please sign in to attach files')
              }
            }}
            size="icon-sm"
            type="button"
            variant="chatInput"
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
          <div className={buttonVariants({ variant: 'chatInput', size: 'sm' })}>
            <Switch
              id="web-search"
              checked={config.shouldWebSearch}
              onCheckedChange={() => updateConfig({ shouldWebSearch: !config.shouldWebSearch })}
              className="cursor-pointer"
            />
            <Label htmlFor="web-search" className="cursor-pointer font-normal">
              Web search
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="chatInput" className="rounded-lg" size="sm" suppressHydrationWarning>
                {config.selectedModel}
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit rounded-xl p-2">
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
      </div>
    </form>
  )
}
