import type { Model } from '@/lib/types'

export const models: Model[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    isReasoningModel: false,
    default: true,
  },
  {
    id: 'reasoning-google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Reasoning)',
    isReasoningModel: true,
    default: false,
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    isReasoningModel: true,
    default: false,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    isReasoningModel: false,
    default: false,
  },
  {
    id: 'reasoning-anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5 (Reasoning)',
    isReasoningModel: true,
    default: false,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    isReasoningModel: true,
    default: false,
  },
  {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    isReasoningModel: true,
    default: false,
  },
]
