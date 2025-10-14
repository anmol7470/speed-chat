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
import { Button } from './ui/button'

export function ChatContainerParent({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  const router = useRouter()

  const {
    data: messages,
    error,
    isPending,
    isError,
  } = useQueryWithStatus(
    api.chat.getChatMessages,
    paramsChatId && user ? { userId: user.id, chatId: paramsChatId } : 'skip'
  )

  useEffect(() => {
    if (isError) {
      toast.error(error.message)
      router.push('/')
    }
  }, [isError, error, router])

  return (
    <Provider>
      <ChatContainer
        user={user}
        initialMessages={messages}
        isLoadingMessages={isPending}
        isNewChat={paramsChatId === ''}
      />
    </Provider>
  )
}

function ChatContainer({
  user,
  initialMessages,
  isLoadingMessages,
  isNewChat,
}: {
  user: User | undefined
  initialMessages: UIMessageWithMetadata[] | undefined
  isLoadingMessages: boolean
  isNewChat: boolean
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
    return {
      body: {
        chatId,
        model: models.find((m) => m.name === config.selectedModel),
        isNewChat,
      },
      headers: {
        'x-api-key': config.apiKey,
      },
    }
  }, [chatId, config, isNewChat])

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

    if (isNewChat) {
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
      {isLoadingMessages && !isNewChat ? null : messages.length === 0 && isNewChat ? (
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
        <>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? 'User: ' : 'AI: '}
              {message.parts.map((part, index) => (part.type === 'text' ? <span key={index}>{part.text}</span> : null))}
            </div>
          ))}
        </>
      )}
      <ApiKeyDialog open={openApiKeyDialog} onOpenChange={setOpenApiKeyDialog} />
    </div>
  )
}
