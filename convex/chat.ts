import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, generateText } from 'ai'
import { FunctionReturnType } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { titleGenPrompt } from '../lib/ai/prompts'
import type { UIMessageWithMetadata } from '../lib/types'
import { api, internal } from './_generated/api'
import { action, internalMutation, mutation, query } from './_generated/server'

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

export type Chat = FunctionReturnType<typeof api.chat.getAllChats>[number]

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
      throw new ConvexError('Chat not found')
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
      .order('asc')
      .collect()

    const uiMessages = messages.map((message) => ({
      id: message.id,
      role: message.role,
      metadata: message.metadata,
      parts: message.parts,
    })) as UIMessageWithMetadata[]

    return uiMessages
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
      model: openrouter('google/gemini-2.5-flash'),
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
      throw new ConvexError('Chat not found')
    }

    await ctx.db.patch(chat._id, { title: args.title })
  },
})

export const upsertMessage = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    const message = args.message as UIMessageWithMetadata

    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) => q.eq('id', args.chatId).eq('userId', args.userId))
      .first()

    if (!chat) {
      throw new ConvexError('Chat not found')
    }

    const existingMessage = await ctx.db
      .query('messages')
      .withIndex('by_message_id', (q) => q.eq('id', message.id))
      .first()

    if (existingMessage) {
      await ctx.db.patch(existingMessage._id, {
        ...message,
        text_part: message.parts.map((part) => (part.type === 'text' ? part.text : '')).join(' '),
      })
    } else {
      await ctx.db.insert('messages', {
        ...message,
        text_part: message.parts.map((part) => (part.type === 'text' ? part.text : '')).join(' '),
        chatId: chat._id,
      })
    }

    await ctx.db.patch(chat._id, {
      updatedAt: Date.now(),
    })
  },
})
