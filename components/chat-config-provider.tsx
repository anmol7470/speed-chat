'use client'

import { models } from '@/lib/ai/models'
import { type ChatConfig, ChatConfigSchema } from '@/lib/types'
import { customAlphabet } from 'nanoid'
import { usePathname } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { ApiKeyDialog } from './api-key-dialog'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21)

type ChatConfigContextType = {
  config: ChatConfig
  updateConfig: (updates: Partial<ChatConfig>) => void
  chatId: string
  setChatId: (chatId: string) => void
  openApiKeyDialog: boolean
  setOpenApiKeyDialog: (open: boolean) => void
  isLoading: boolean
}

const ChatConfigContext = createContext<ChatConfigContextType | undefined>(undefined)

const STORAGE_KEY = 'chat-config'

const getDefaultConfig = (): ChatConfig => ({
  selectedModel: models.find((m) => m.default)?.name || 'GPT-5',
  apiKey: '',
  shouldWebSearch: false,
})

export function ChatConfigProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const urlChatId = pathname.split('/chat/')[1] ?? ''
  const [config, setConfigState] = useState<ChatConfig>(getDefaultConfig())
  const [chatId, setChatId] = useState<string>(() => urlChatId || nanoid())
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Update chatId when URL changes
  useEffect(() => {
    if (urlChatId) {
      // Navigating to an existing chat
      setChatId(urlChatId)
    } else {
      // Navigating to home
      const newId = nanoid()
      setChatId(newId)
    }
  }, [urlChatId])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const validated = ChatConfigSchema.parse(parsed)
        setConfigState(validated)
      } else {
        // No stored config, use default
        setConfigState(getDefaultConfig())
      }
    } catch (error) {
      console.error('Failed to load chat config from localStorage:', error)
      // Clear invalid data and use default
      localStorage.removeItem(STORAGE_KEY)
      setConfigState(getDefaultConfig())
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save chat config to localStorage:', error)
    }
  }, [config])

  const updateConfig = (updates: Partial<ChatConfig>) => {
    try {
      const merged = { ...config, ...updates }
      const validated = ChatConfigSchema.parse(merged)
      setConfigState(validated)
    } catch (error) {
      console.error('Invalid chat config update:', error)
    }
  }

  return (
    <ChatConfigContext.Provider
      value={{ config, updateConfig, chatId, setChatId, openApiKeyDialog, setOpenApiKeyDialog, isLoading }}
    >
      {children}
      <ApiKeyDialog open={openApiKeyDialog} onOpenChange={setOpenApiKeyDialog} />
    </ChatConfigContext.Provider>
  )
}

export function useChatConfig() {
  const context = useContext(ChatConfigContext)
  if (context === undefined) {
    throw new Error('useChatConfig must be used within a ChatConfigProvider')
  }
  return context
}
