import type { UIMessage } from 'ai'
import * as z from 'zod'

// Reasoning version of the model for the model prefixed with 'reasoning-' to distinguish from the non-reasoning version
export type ModelId =
  | 'google/gemini-2.5-flash'
  | 'reasoning-google/gemini-2.5-flash'
  | 'google/gemini-3-pro-preview'
  | 'anthropic/claude-sonnet-4.5'
  | 'reasoning-anthropic/claude-sonnet-4.5'
  | 'openai/gpt-5.1'
  | 'x-ai/grok-4.1-fast'

export type Model = {
  id: ModelId
  name: string
  default: boolean
  isReasoningModel: boolean
}

export const DraftMessageEntrySchema = z.object({
  message: z.string(),
  files: z.array(z.any()),
})

export type DraftMessageEntry = z.infer<typeof DraftMessageEntrySchema>

export const ChatConfigSchema = z.object({
  selectedModelId: z.custom<ModelId>(), // to load last used model on page load
  apiKey: z.string(),
  draftMessageEntry: DraftMessageEntrySchema.optional(),
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
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
