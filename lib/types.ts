import type { UIMessage } from 'ai'
import * as z from 'zod'

export type ModelId =
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro'
  | 'anthropic/claude-sonnet-4.5'
  | 'openai/gpt-5'
  | 'x-ai/grok-4-fast'

export type Model = {
  id: ModelId
  name: string
  default: boolean
  supportsReasoning: boolean
  reasoningConfigurable: boolean
}

export const ChatConfigSchema = z.object({
  selectedModelId: z.custom<ModelId>(), // to load last used model on page load
  apiKey: z.string(),
})

export type ChatConfig = z.infer<typeof ChatConfigSchema>

export type MessageMetadata = {
  modelId: ModelId
}

export type UIMessageWithMetadata = UIMessage<MessageMetadata>

export const ChatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessageWithMetadata>()),
  chatId: z.string(),
  model: z.custom<Model>(),
  isNewChat: z.boolean(),
  useWebSearch: z.boolean(),
  useReasoning: z.boolean(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
