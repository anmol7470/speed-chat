'use client'

import { api } from '@/convex/_generated/api'
import { models } from '@/lib/models'
import type { ChatRequest, Model, UIMessageWithMetadata } from '@/lib/types'
import { useQueryWithStatus } from '@/lib/utils'
import { useChat, UseChatHelpers } from '@ai-sdk/react'
import { createIdGenerator, DefaultChatTransport, FileUIPart } from 'ai'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '../ui/button'
import { useChatConfig } from './chat-config-provider'
import { useDialogs } from './dialogs-provider'
import { useUser } from './user-provider'

type ChatContextType = {
  input: string
  setInput: (input: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  filesToSend: FileUIPart[]
  setFilesToSend: React.Dispatch<React.SetStateAction<FileUIPart[]>>
  filesToUpload: File[]
  setFilesToUpload: React.Dispatch<React.SetStateAction<File[]>>
  isStreaming: boolean
  messages: UIMessageWithMetadata[]
  sendMessage: UseChatHelpers<UIMessageWithMetadata>['sendMessage']
  status: UseChatHelpers<UIMessageWithMetadata>['status']
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
  useReasoning: boolean
  setUseReasoning: (useReasoning: boolean) => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children, paramsChatId }: { children: React.ReactNode; paramsChatId: string }) => {
  const router = useRouter()
  const { user } = useUser()
  const { config, chatId, updateDraftMessageEntry, clearDraftMessageEntry, isLoading: configLoading } = useChatConfig()
  const { setOpenApiKeyDialog } = useDialogs()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [filesToSend, setFilesToSend] = useState<FileUIPart[]>([])
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [useReasoning, setUseReasoning] = useState(false)

  const {
    data: initialMessages,
    isPending,
    isError,
  } = useQueryWithStatus(api.chat.getChatMessages, paramsChatId && user ? { chatId: paramsChatId } : 'skip')

  useEffect(() => {
    if (isError) {
      toast.error(`Chat ${paramsChatId} not found`)
      router.push('/')
    }
  }, [isError, router, paramsChatId])

  const { messages, sendMessage, status, setMessages, regenerate, error, clearError, resumeStream } =
    useChat<UIMessageWithMetadata>({
      id: chatId,
      generateId: createIdGenerator({
        prefix: 'user',
        size: 16,
      }),
      transport: new DefaultChatTransport({
        api: '/api/chat',
      }),
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

  // Load draft message and files only once on mount when on homepage
  const hasLoadedDraftRef = useRef(false)
  useEffect(() => {
    if (!configLoading && !paramsChatId && config.draftMessageEntry && !hasLoadedDraftRef.current) {
      setInput(config.draftMessageEntry.message)
      setFilesToSend(config.draftMessageEntry.files)

      const reconstructedFiles = config.draftMessageEntry.files.map((file) => {
        return new File([], file.filename, { type: file.mediaType })
      })
      setFilesToUpload(reconstructedFiles)

      hasLoadedDraftRef.current = true
    }
  }, [configLoading, paramsChatId, config.draftMessageEntry])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    // Only save to localStorage if on homepage
    if (!paramsChatId && hasLoadedDraftRef.current) {
      updateDraftMessageEntry(value, filesToSend)
    }
  }

  // Persist filesToSend whenever they change
  useEffect(() => {
    if (!configLoading && !paramsChatId && hasLoadedDraftRef.current) {
      updateDraftMessageEntry(input, filesToSend)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoading, filesToSend, paramsChatId, input])

  const isStreaming = status === 'streaming' || status === 'submitted'

  const buildBodyAndHeaders = useCallback(() => {
    const isFirstMessage = messages.length === 0
    return {
      body: {
        chatId,
        model: models.find((m) => m.id === config.selectedModelId)!,
        useWebSearch,
        useReasoning,
        isNewChat: isFirstMessage,
      } satisfies Omit<ChatRequest, 'messages'>,
      headers: {
        'x-api-key': config.apiKey,
      },
    }
  }, [chatId, config, messages, useWebSearch, useReasoning])

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
            variant="secondary"
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
    setFilesToUpload([])
    // Clear draft message from localStorage when starting new chat
    if (!paramsChatId) {
      clearDraftMessageEntry()
    }
  }

  useEffect(() => {
    if (paramsChatId === chatId) {
      resumeStream()
    }
  }, [paramsChatId, chatId, resumeStream])

  return (
    <ChatContext.Provider
      value={{
        input,
        setInput,
        inputRef,
        handleInputChange,
        filesToSend,
        setFilesToSend,
        filesToUpload,
        setFilesToUpload,
        isStreaming,
        messages,
        sendMessage,
        status,
        regenerate,
        isLoadingMessages: isPending && !!paramsChatId && !!user,
        handleSubmit,
        error,
        clearError,
        buildBodyAndHeaders,
        useWebSearch,
        setUseWebSearch,
        useReasoning,
        setUseReasoning,
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
