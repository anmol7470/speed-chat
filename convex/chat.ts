import { action, internalMutation, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { convertToModelMessages } from 'ai'
import type { UIMessageWithMetadata } from '../lib/types'
import { titleGenPrompt } from '../lib/ai/prompts'

export const getAllChats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chats')
      .withIndex('by_user_id_and_updated_at', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})

export const getChatMessages = query({
  args: {
    userId: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) => q.eq('id', args.chatId).eq('userId', args.userId))
      .first()

    if (!chat) {
      throw new Error('Chat not found')
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
      .order('asc')
      .collect()
  },
})

export const createChat = mutation({
  args: {
    userId: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('chats', {
      id: args.chatId,
      userId: args.userId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBranch: false,
      isPinned: false,
    })
  },
})

export const generateChatTitle = action({
  args: {
    chatId: v.string(),
    apiKey: v.string(),
    userId: v.string(),
    userMessage: v.any(),
  },
  handler: async (ctx, args) => {
    const openrouter = createOpenRouter({
      apiKey: args.apiKey,
    })

    const response = await generateText({
      model: openrouter('google/gemini-2.5-flash-lite'),
      system: titleGenPrompt,
      messages: convertToModelMessages([args.userMessage as UIMessageWithMetadata]),
    })

    if (response.text) {
      await ctx.runMutation(internal.chat.updateChatTitle, {
        userId: args.userId,
        chatId: args.chatId,
        title: response.text,
      })
    }
  },
})

export const updateChatTitle = internalMutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) => q.eq('id', args.chatId).eq('userId', args.userId))
      .first()

    if (!chat) {
      throw new Error('Chat not found')
    }

    await ctx.db.patch(chat._id, { title: args.title })
  },
})
