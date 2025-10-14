import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const schema = defineSchema({
  chats: defineTable({
    id: v.string(),
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isBranch: v.boolean(),
    isPinned: v.boolean(),
    parentChatId: v.optional(v.string()),
  })
    .index('by_chat_id', ['id'])
    .index('by_chat_id_and_user_id', ['id', 'userId'])
    .index('by_user_id_and_updated_at', ['userId', 'updatedAt'])
    .searchIndex('by_title', {
      searchField: 'title',
      filterFields: ['userId'],
    }),

  streams: defineTable({
    id: v.string(),
    chatId: v.id('chats'),
    userId: v.string(),
  }).index('by_chat_id', ['chatId']),

  messages: defineTable({
    id: v.string(),
    chatId: v.id('chats'),
    metadata: v.optional(
      v.object({
        modelName: v.string(),
        tps: v.number(),
        ttft: v.number(),
        elapsedTime: v.number(),
        completionTokens: v.number(),
      })
    ),
    role: v.union(v.literal('system'), v.literal('user'), v.literal('assistant')),
    text_part: v.string(), // separate text part for search
    parts: v.array(v.any()), // full parts array object typed as any for simplicity
  })
    .index('by_chat_id', ['chatId'])
    .index('by_message_id', ['id'])
    .searchIndex('by_text_part', {
      searchField: 'text_part',
      filterFields: ['chatId'],
    }),
})

export default schema
