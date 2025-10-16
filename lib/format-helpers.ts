import { formatDuration, intervalToDuration } from 'date-fns'

type ProviderMetadata = {
  openai?: { itemId?: string }
  itemId?: string
}

type ReasoningPart = {
  type: 'reasoning'
  text?: string
  state?: string
  providerMetadata?: ProviderMetadata
}

type TextPart = { type: 'text'; text: string }

type WebSearchPart = {
  type: 'tool-web_search'
  state?: string
  output?: {
    action: {
      query: string
    }
  }
}

type AnyPart = ReasoningPart | TextPart | WebSearchPart | { type: string }

export type GroupedItem =
  | {
      kind: 'reasoning'
      text: string
      isStreaming: boolean
      defaultOpen: boolean
      groupKey: string
    }
  | { kind: 'text'; part: TextPart }
  | { kind: 'web'; part: WebSearchPart }
  | { kind: 'unknown' }

const isReasoningPart = (p: unknown): p is ReasoningPart => {
  return !!p && typeof p === 'object' && (p as AnyPart).type === 'reasoning'
}

const isTextPart = (p: unknown): p is TextPart => {
  return !!p && typeof p === 'object' && (p as AnyPart).type === 'text' && typeof (p as TextPart).text === 'string'
}

const isWebSearchPart = (p: unknown): p is WebSearchPart => {
  return !!p && typeof p === 'object' && (p as AnyPart).type === 'tool-web_search'
}

const getSignature = (part: ReasoningPart): string => {
  return part?.providerMetadata?.openai?.itemId ?? part?.providerMetadata?.itemId ?? ''
}

// Groups multiple reasoning parts into a single part
// All GPT-5 models do this
export function groupMessageParts(parts: Array<unknown>): Array<GroupedItem> {
  const grouped: Array<GroupedItem> = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (isReasoningPart(part)) {
      const signature = getSignature(part)
      let text = ''
      let isStreaming = false

      let j = i
      while (j < parts.length) {
        const next = parts[j]
        if (!isReasoningPart(next)) break
        const nextSignature = getSignature(next)
        if (nextSignature !== signature) break

        const nextText = (next.text ?? '').toString()
        if (nextText.trim().length > 0) {
          text = text.length > 0 ? `${text}\n\n${nextText}` : nextText
        }
        // Reflect the latest chunk's state for the group so UI reacts to end-of-stream correctly
        isStreaming = next.state === 'streaming'
        j++
      }

      if (text.trim().length > 0) {
        grouped.push({
          kind: 'reasoning',
          text,
          isStreaming,
          // Only auto-open when actively streaming; avoids open/close on refresh
          defaultOpen: isStreaming,
          groupKey: `reasoning:${signature || 'no-sig'}:${i}`,
        })
      }

      i = j - 1
      continue
    }

    if (isTextPart(part)) {
      grouped.push({ kind: 'text', part })
      continue
    }

    if (isWebSearchPart(part)) {
      grouped.push({ kind: 'web', part })
      continue
    }

    grouped.push({ kind: 'unknown' })
  }

  return grouped
}

export function formatElapsedTime(seconds: number): string {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })

  if (seconds < 60) {
    return formatDuration(duration, { format: ['seconds'] })
  }

  return formatDuration(duration, { format: ['minutes', 'seconds'] })
}
