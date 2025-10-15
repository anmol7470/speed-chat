import type { Model } from '@/lib/types'

export const models: Model[] = [
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5',
    supportsReasoning: true,
    reasoningConfigurable: true,
    supportsWebSearchTool: true,
    default: true,
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    supportsReasoning: true,
    reasoningConfigurable: false,
    supportsWebSearchTool: true,
    default: false,
  },
  {
    id: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    supportsReasoning: true,
    reasoningConfigurable: false,
    supportsWebSearchTool: false,
    default: false,
  },
  {
    id: 'gpt-5-chat-latest',
    name: 'GPT-5 Chat',
    supportsReasoning: false,
    reasoningConfigurable: false,
    supportsWebSearchTool: true,
    default: false,
  },
  {
    id: 'chatgpt-4o-latest',
    name: 'ChatGPT 4o',
    supportsReasoning: false,
    reasoningConfigurable: false,
    supportsWebSearchTool: false,
    default: false,
  },
]
