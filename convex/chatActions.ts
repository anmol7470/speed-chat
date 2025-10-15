import { ConvexError, v } from 'convex/values'
import { nanoid } from 'nanoid'
import { mutation } from './_generated/server'

export const branchOffFromMessage = mutation({
  args: {
    parentChatId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const branchChatId = nanoid()

    const parentChat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.parentChatId))
      .first()

    if (!parentChat) {
      throw new ConvexError(`Chat ${args.parentChatId} not found`)
    }

    const parentMessages = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', parentChat._id))
      .collect()

    const messagesUntilMessageToBranch = parentMessages.slice(
      0,
      parentMessages.findIndex((m) => m.id === args.messageId) + 1
    )

    const branchChatConvexId = await ctx.db.insert('chats', {
      id: branchChatId,
      title: parentChat.title,
      userId: parentChat.userId,
      isBranch: true,
      isPinned: false,
      parentChatId: parentChat.id,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    })

    for (const message of messagesUntilMessageToBranch) {
      await ctx.db.insert('messages', {
        id: `${message.id}-branch-${branchChatId}`,
        chatId: branchChatConvexId,
        text_part: message.text_part,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      })
    }

    return branchChatId
  },
})

export const renameChatTitle = mutation({
  args: {
    chatId: v.string(),
    newTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first()

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`)
    }

    await ctx.db.patch(chat._id, {
      title: args.newTitle,
    })
  },
})

export const pinChat = mutation({
  args: {
    chatId: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first()

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`)
    }

    await ctx.db.patch(chat._id, {
      isPinned: args.isPinned,
    })
  },
})
