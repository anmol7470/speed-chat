import type { UIMessage } from 'ai'
import * as z from 'zod'

export type ModelId =
  | 'gpt-5-2025-08-07'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-4.1-2025-04-14'
  | 'gpt-5-chat-latest'
  | 'chatgpt-4o-latest'

export type Model = {
  id: ModelId
  name: string
  default: boolean
  supportsReasoning: boolean
  supportsWebSearchTool: boolean
}

export const ChatConfigSchema = z.object({
  selectedModelId: z.custom<ModelId>(),
  apiKey: z.string(),
})

export type ChatConfig = z.infer<typeof ChatConfigSchema>

export type MessageMetadata = {
  modelId: ModelId
  elapsedTime: number
  completionTokens: number
}

export type UIMessageWithMetadata = UIMessage<MessageMetadata>

export const ChatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessageWithMetadata>()),
  chatId: z.string(),
  model: z.custom<Model>(),
  isNewChat: z.boolean(),
  useWebSearch: z.boolean(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
