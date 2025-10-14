import type { Model } from '@/lib/types'

export const models: Model[] = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    reasoningModel: false,
    default: true,
    provider: 'openai',
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5 Reasoning',
    reasoningModel: true,
    default: false,
    provider: 'openai',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    reasoningModel: false,
    default: false,
    provider: 'anthropic',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5 Reasoning',
    reasoningModel: true,
    default: false,
    provider: 'anthropic',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    reasoningModel: false,
    default: false,
    provider: 'google',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    reasoningModel: true,
    default: false,
    provider: 'google',
  },
]
