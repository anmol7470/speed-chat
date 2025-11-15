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
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
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
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    isReasoningModel: true,
    default: false,
  },
]
