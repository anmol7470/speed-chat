'use client'

import { useChatConfig } from '@/components/chat-config-provider'
import { api } from '@/convex/_generated/api'
import { models } from '@/lib/ai/models'
import { UIMessageWithMetadata } from '@/lib/types'
import { useQueryWithStatus } from '@/lib/utils'
import { Provider, useChat } from '@ai-sdk-tools/store'
import { createIdGenerator, DefaultChatTransport } from 'ai'
import { User } from 'better-auth'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ApiKeyDialog } from './api-key-dialog'
import { ChatInput } from './chat-input'
import { Header } from './header'
import { Messages } from './messages'
import { Button } from './ui/button'

export function ChatContainerParent({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  const router = useRouter()

  const {
    data: messages,
    isPending,
    isError,
  } = useQueryWithStatus(
    api.chat.getChatMessages,
    paramsChatId && user ? { userId: user.id, chatId: paramsChatId } : 'skip'
  )

  useEffect(() => {
    if (isError) {
      toast.error(`Chat ${paramsChatId} not found`)
      router.push('/')
    }
  }, [isError, router, paramsChatId])

  return (
    <Provider>
      <ChatContainer user={user} initialMessages={messages} isLoadingMessages={isPending && paramsChatId !== ''} />
    </Provider>
  )
}

function ChatContainer({
  user,
  initialMessages,
  isLoadingMessages,
}: {
  user: User | undefined
  initialMessages: UIMessageWithMetadata[] | undefined
  isLoadingMessages: boolean
}) {
  const { chatId, config } = useChatConfig()
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const { messages, sendMessage, status, regenerate, error, stop, setMessages } = useChat<UIMessageWithMetadata>({
    id: chatId,
    generateId: createIdGenerator({
      prefix: 'user',
      size: 16,
    }),
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  useEffect(() => {
    // Always set messages when initialMessages or chatId changes
    // This ensures old messages are cleared when navigating between chats
    setMessages(initialMessages || [])
  }, [initialMessages, chatId, setMessages])

  const isStreaming = status === 'streaming' || status === 'submitted'

  const buildBodyAndHeaders = useCallback(() => {
    const isFirstMessage = messages.length === 0
    return {
      body: {
        chatId,
        model: models.find((m) => m.name === config.selectedModel),
        isNewChat: isFirstMessage,
      },
      headers: {
        'x-api-key': config.apiKey,
      },
    }
  }, [chatId, config, messages.length])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to chat')
      return
    }

    if (!input.trim() || isStreaming) {
      return
    }

    if (!config.apiKey) {
      toast.error((t) => (
        <div className="flex items-center gap-2">
          <p>Please set an API key</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setOpenApiKeyDialog(true)
              toast.dismiss(t.id)
            }}
          >
            Set API Key
          </Button>
        </div>
      ))
      return
    }

    if (messages.length === 0) {
      window.history.replaceState({}, '', `/chat/${chatId}`)
    }

    const { body, headers } = buildBodyAndHeaders()

    sendMessage(
      {
        text: input,
      },
      {
        body,
        headers,
      }
    )

    setInput('')
  }

  return (
    <div className="relative h-full w-full">
      <Header user={user} />
      {isLoadingMessages ? null : messages.length === 0 ? (
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:px-0">
          <h1 className="text-2xl md:text-3xl">
            {user ? `How can I help you today, ${user.name.split(' ')[0]}?` : 'How can I help you today?'}
          </h1>
          <ChatInput
            user={user}
            input={input}
            inputRef={inputRef}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-2.5 px-4 md:px-0">
          <Messages messages={messages} />
          <ChatInput
            user={user}
            input={input}
            inputRef={inputRef}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
      <ApiKeyDialog open={openApiKeyDialog} onOpenChange={setOpenApiKeyDialog} />
    </div>
  )
}
