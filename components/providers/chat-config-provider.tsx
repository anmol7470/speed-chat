'use client'

import { models } from '@/lib/models'
import { type ChatConfig, ChatConfigSchema } from '@/lib/types'
import type { FileUIPart } from 'ai'
import { customAlphabet } from 'nanoid'
import { usePathname } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21)

type ChatConfigContextType = {
  config: ChatConfig
  updateConfig: (updates: Partial<ChatConfig>) => void
  chatId: string
  setChatId: (chatId: string) => void
  isLoading: boolean
  updateDraftMessageEntry: (message: string, files: FileUIPart[]) => void
  clearDraftMessageEntry: () => void
}

const ChatConfigContext = createContext<ChatConfigContextType | undefined>(undefined)

const STORAGE_KEY = 'chat-config'

const getDefaultConfig = (): ChatConfig => ({
  selectedModelId: models.find((m) => m.default)?.id || 'google/gemini-2.5-flash',
  apiKey: '',
  draftMessageEntry: { message: '', files: [] },
})

export function ChatConfigProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const urlChatId = pathname.split('/chat/')[1] ?? ''
  const [config, setConfigState] = useState<ChatConfig>(getDefaultConfig())
  const [chatId, setChatId] = useState<string>(() => urlChatId || nanoid())
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

  const updateDraftMessageEntry = (message: string, files: FileUIPart[]) => {
    // Only update draft message in localStorage if we're not on a specific chat route
    if (!urlChatId) {
      updateConfig({ draftMessageEntry: { message, files } })
    }
  }

  const clearDraftMessageEntry = () => {
    updateConfig({ draftMessageEntry: { message: '', files: [] } })
  }

  return (
    <ChatConfigContext.Provider
      value={{ config, updateConfig, chatId, setChatId, isLoading, updateDraftMessageEntry, clearDraftMessageEntry }}
    >
      {children}
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
