import type { Model } from '@/lib/types'

export const models: Model[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    supportsReasoning: true,
    reasoningConfigurable: true,
    default: true,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    supportsReasoning: true,
    reasoningConfigurable: false,
    default: false,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    supportsReasoning: true,
    reasoningConfigurable: true,
    default: false,
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    supportsReasoning: true,
    reasoningConfigurable: true,
    default: false,
  },
  {
    id: 'openai/gpt-5-chat',
    name: 'GPT-5 Chat',
    supportsReasoning: false,
    reasoningConfigurable: false,
    default: false,
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    supportsReasoning: true,
    reasoningConfigurable: false,
    default: false,
  },
]
