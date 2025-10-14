import { api } from '@/convex/_generated/api'
import type { UIMessage } from 'ai'
import { FunctionReturnType } from 'convex/server'
import * as z from 'zod'

export type ModelProvider = 'openai' | 'anthropic' | 'google'

export type ModelId =
  | 'anthropic/claude-sonnet-4.5'
  | 'openai/gpt-5'
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro'

export type Model = {
  id: ModelId
  name: string
  reasoningModel: boolean
  default: boolean
  provider: ModelProvider
}

export const ChatConfigSchema = z.object({
  selectedModel: z.string(), // saving model name cos model id is not unique
  apiKey: z.string(),
  shouldWebSearch: z.boolean(),
})

export type ChatConfig = z.infer<typeof ChatConfigSchema>

export type MessageMetadata = {
  modelName: string
  tps: number // tokens per second
  ttft: number // time to first token
  elapsedTime: number
  completionTokens: number
}

export type UIMessageWithMetadata = UIMessage<MessageMetadata>

export type Chat = FunctionReturnType<typeof api.chat.getAllChats>[number]
