import { getManyFrom } from 'convex-helpers/server/relationships'
import type { FunctionReturnType } from 'convex/server'
import { v } from 'convex/values'
import type { api } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { authedQuery } from './user'

export type SearchResult = FunctionReturnType<typeof api.search.searchAll>

// Combined search for both chats and messages
export const searchAll = authedQuery({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const limit = 20
    const queryString = args.query.trim()

    if (!queryString) {
      return []
    }

    // Search chats by title
    const chatResults = await ctx.db
      .query('chats')
      .withSearchIndex('by_title', (q) => q.search('title', queryString).eq('userId', ctx.userId))
      .take(limit)

    // Get all user chats for searching
    const userChats = await getManyFrom(ctx.db, 'chats', 'by_user_id', ctx.userId, 'userId')

    const chatMap = new Map<string, Doc<'chats'>>()
    for (const chat of userChats) {
      chatMap.set(chat._id, chat)
    }

    // Search messages across all user chats
    const messageResultsMap = new Map<string, Doc<'messages'>>()

    for (const chat of userChats) {
      const messages = await ctx.db
        .query('messages')
        .withSearchIndex('by_text_part', (q) => q.search('text_part', queryString).eq('chatId', chat._id))
        .take(limit)

      for (const message of messages) {
        messageResultsMap.set(message._id, message)
      }
    }

    // Process message results
    const processedMessages = Array.from(messageResultsMap.values())
      .map((message) => {
        const chat = chatMap.get(message.chatId)
        if (!chat) return null

        const { snippet, isHighlighted } = getHighlightContext(message.text_part, queryString)
        return {
          type: 'message' as const,
          ...message,
          chatTitle: chat.title,
          chatId: chat.id,
          highlightSnippet: snippet,
          isHighlighted,
          updatedAt: chat.updatedAt,
        }
      })
      .filter((msg): msg is NonNullable<typeof msg> => msg !== null)

    // Combine and deduplicate results by chat ID (prefer message matches over title matches for more context)
    const chatResultsWithType = chatResults.map((chat) => ({ type: 'chat' as const, ...chat }))

    // Deduplicate messages to one per chat (keep the first/most relevant one)
    const messagesByChatId = new Map<string, (typeof processedMessages)[number]>()
    for (const message of processedMessages) {
      if (!messagesByChatId.has(message.chatId)) {
        messagesByChatId.set(message.chatId, message)
      }
    }

    // Track which chats we've already included
    const includedChatIds = new Set<string>()
    const deduplicatedResults: Array<(typeof chatResultsWithType)[number] | (typeof processedMessages)[number]> = []

    // First add message matches (they provide snippet context) - one per chat
    for (const message of messagesByChatId.values()) {
      includedChatIds.add(message.chatId)
      deduplicatedResults.push(message)
    }

    // Then add chat title matches only if their chat isn't already included
    for (const chat of chatResultsWithType) {
      if (!includedChatIds.has(chat.id)) {
        includedChatIds.add(chat.id)
        deduplicatedResults.push(chat)
      }
    }

    // Sort by most recent (updatedAt)
    const sorted = deduplicatedResults.sort((a, b) => b.updatedAt - a.updatedAt)

    return sorted.slice(0, limit)
  },
})

// Helper function to extract highlight context around query match
const getHighlightContext = (text: string, queryString: string): { snippet: string; isHighlighted: boolean } => {
  const lowerText = text.toLowerCase()
  const lowerQuery = queryString.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    return {
      snippet: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
      isHighlighted: false,
    }
  }

  const contextLength = 60 // Characters to show on each side
  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + queryString.length + contextLength)

  let snippet = text.slice(start, end)

  // Add ellipsis if we truncated
  if (start > 0) snippet = `...${snippet}`
  if (end < text.length) snippet += '...'

  return { snippet, isHighlighted: true }
}
