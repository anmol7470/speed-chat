'use client'

import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { BaseAssistantMessage } from '@/components/assistant-message'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BaseUserMessage } from '@/components/user-message'
import { api } from '@/convex/_generated/api'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getErrorMessage } from '@/lib/error'
import { models } from '@/lib/models'
import type { UIMessageWithMetadata } from '@/lib/types'
import { type Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { Check, Copy, GitFork, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { nanoid } from './providers/chat-config-provider'
import { useUser } from './providers/user-provider'

type SharedChatContainerProps = {
  preloadedChat: Preloaded<typeof api.chat.getSharedChat>
}

export function SharedChatContainer({ preloadedChat }: SharedChatContainerProps) {
  const router = useRouter()
  const { user } = useUser()
  const { chatData, messages } = usePreloadedQuery(preloadedChat)
  const forkChat = useMutation(api.chatActions.forkChat)
  const [isForking, setIsForking] = useState(false)
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const handleFork = async () => {
    if (!user) {
      toast.error('Please sign in to fork this chat')
      return
    }

    setIsForking(true)
    try {
      const newChatId = nanoid()
      await forkChat({ chatId: chatData.id, newChatId })
      toast.success('Chat forked successfully')
      router.push(`/chat/${newChatId}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsForking(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-border flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Info className="text-muted-foreground size-4" />
          <p className="text-sm font-medium">{chatData.isOwner ? 'This is your shared chat' : 'Viewing shared chat'}</p>
        </div>
        {chatData.isOwner ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/chat/${chatData.id}`}>Edit chat</Link>
          </Button>
        ) : (
          <Button onClick={handleFork} disabled={isForking} size="sm">
            {isForking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Forking...
              </>
            ) : (
              <>
                <GitFork className="size-4" />
                Fork chat
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="overflow-hidden">
          <ConversationContent className="mx-auto w-full max-w-3xl px-4 md:px-0">
            <div className="mx-auto max-w-[745px] space-y-4 pt-16 pb-8 text-[14.5px]">
              {messages.map((message: UIMessageWithMetadata) => {
                const messageContent = message.parts
                  .filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('')

                if (message.role === 'user') {
                  return (
                    <div key={message.id} className="group ml-auto flex flex-col">
                      <BaseUserMessage message={message} />
                      <div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>{isCopied ? 'Copied!' : 'Copy'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )
                }

                if (message.role === 'assistant') {
                  return (
                    <div key={message.id} className="group">
                      <BaseAssistantMessage message={message} isAnimating={false} />
                      <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              type="button"
                              onClick={() => copyToClipboard(messageContent)}
                            >
                              {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                              <span className="sr-only">Copy message</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isCopied ? 'Copied!' : 'Copy'}</TooltipContent>
                        </Tooltip>
                        {message.metadata && (
                          <span className="text-muted-foreground text-xs">
                            Generated by{' '}
                            <span className="font-medium">
                              {models.find((model) => model.id === message.metadata?.modelId)?.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          </ConversationContent>
        </Conversation>
      </div>
    </div>
  )
}
