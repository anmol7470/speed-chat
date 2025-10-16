'use client'

import { api } from '@/convex/_generated/api'
import { models } from '@/lib/models'
import type { ChatRequest, Model, UIMessageWithMetadata } from '@/lib/types'
import { useQueryWithStatus } from '@/lib/utils'
import { useChat, UseChatHelpers } from '@ai-sdk/react'
import { createIdGenerator, DefaultChatTransport, FileUIPart } from 'ai'
import type { User } from 'better-auth'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useChatConfig } from './chat-config-provider'
import { Button } from './ui/button'

type ChatContextType = {
  input: string
  setInput: (input: string) => void
  filesToSend: FileUIPart[]
  setFilesToSend: React.Dispatch<React.SetStateAction<FileUIPart[]>>
  isStreaming: boolean
  messages: UIMessageWithMetadata[]
  sendMessage: UseChatHelpers<UIMessageWithMetadata>['sendMessage']
  status: UseChatHelpers<UIMessageWithMetadata>['status']
  stop: UseChatHelpers<UIMessageWithMetadata>['stop']
  regenerate: UseChatHelpers<UIMessageWithMetadata>['regenerate']
  isLoadingMessages: boolean
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  error: UseChatHelpers<UIMessageWithMetadata>['error']
  clearError: UseChatHelpers<UIMessageWithMetadata>['clearError']
  buildBodyAndHeaders: () => {
    body: { chatId: string; model: Model | undefined; isNewChat: boolean }
    headers: { 'x-api-key': string }
  }
  useWebSearch: boolean
  setUseWebSearch: (useWebSearch: boolean) => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({
  children,
  user,
  paramsChatId,
}: {
  children: React.ReactNode
  user: User | undefined
  paramsChatId: string
}) => {
  const router = useRouter()
  const { config, chatId, setOpenApiKeyDialog } = useChatConfig()
  const [input, setInput] = useState('')
  const [filesToSend, setFilesToSend] = useState<FileUIPart[]>([])
  const [useWebSearch, setUseWebSearch] = useState(false)

  const {
    data: initialMessages,
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

  const { messages, sendMessage, status, setMessages, stop, regenerate, error, clearError } =
    useChat<UIMessageWithMetadata>({
      id: chatId,
      generateId: createIdGenerator({
        prefix: 'user',
        size: 16,
      }),
      transport: new DefaultChatTransport({
        api: '/api/chat',
      }),
      // resume: !!paramsChatId,
      onError: (error) => {
        try {
          const errorData = JSON.parse(error.message)
          toast.error(errorData.error || error.message)
        } catch {
          toast.error(error.message)
        }
      },
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
        model: models.find((m) => m.id === config.selectedModelId)!,
        useWebSearch,
        isNewChat: isFirstMessage,
      } satisfies Omit<ChatRequest, 'messages'>,
      headers: {
        'x-api-key': config.apiKey,
      },
    }
  }, [chatId, config, messages, useWebSearch])

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
        files: filesToSend,
      },
      {
        body,
        headers,
      }
    )

    setInput('')
    setFilesToSend([])
  }

  return (
    <ChatContext.Provider
      value={{
        input,
        setInput,
        filesToSend,
        setFilesToSend,
        isStreaming,
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
        isLoadingMessages: isPending && !!paramsChatId && !!user,
        handleSubmit,
        error,
        clearError,
        buildBodyAndHeaders,
        useWebSearch,
        setUseWebSearch,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
