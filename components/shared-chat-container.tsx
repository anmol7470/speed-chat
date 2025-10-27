'use client'

import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { AssistantMessage } from '@/components/assistant-message'
import { Button } from '@/components/ui/button'
import { UserMessage } from '@/components/user-message'
import { api } from '@/convex/_generated/api'
import { getErrorMessage } from '@/lib/error'
import type { UIMessageWithMetadata } from '@/lib/types'
import { type Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { GitFork, Loader2, Share2 } from 'lucide-react'
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
      {/* Banner */}
      <div className="border-border flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Share2 className="text-muted-foreground size-4" />
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

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="overflow-hidden">
          <ConversationContent className="mx-auto w-full max-w-3xl px-4 md:px-0">
            <div className="mx-auto max-w-[745px] space-y-4 pt-16 pb-8 text-[14.5px]">
              {messages.map((message: UIMessageWithMetadata) => {
                if (message.role === 'user') {
                  return <UserMessage key={message.id} message={message} />
                }

                if (message.role === 'assistant') {
                  return <AssistantMessage key={message.id} message={message} isAnimating={false} />
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
