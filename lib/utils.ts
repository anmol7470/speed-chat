import { clsx, type ClassValue } from 'clsx'
import { makeUseQueryWithStatus } from 'convex-helpers/react'
import { useQueries } from 'convex-helpers/react/cache/hooks'
import { twMerge } from 'tailwind-merge'
import type { ModelId } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries)

export const mapModelIdToTokenlens = (modelId: ModelId | undefined) => {
  switch (modelId) {
    case 'gpt-5-2025-08-07':
      return 'openai:gpt-5'
    case 'gpt-5-mini-2025-08-07':
      return 'openai:gpt-5-mini'
    case 'gpt-5-nano-2025-08-07':
      return 'openai:gpt-5-nano'
    case 'gpt-5-chat-latest':
      return 'openai:gpt-5-chat-latest'
    case 'chatgpt-4o-latest':
      return 'openai:gpt-4o'
    default:
      return modelId
  }
}
