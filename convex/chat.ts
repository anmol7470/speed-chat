import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, generateText } from 'ai'
import { getManyFrom, getOneFrom } from 'convex-helpers/server/relationships'
import { FunctionReturnType } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { titleGenPrompt } from '../lib/prompts'
import type { UIMessageWithMetadata } from '../lib/types'
import { api, internal } from './_generated/api'
import { action, internalMutation, mutation, query } from './_generated/server'

export const getAllChats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chats = await getManyFrom(ctx.db, 'chats', 'by_user_id', args.userId, 'userId')
    return chats.sort((a, b) => b.updatedAt - a.updatedAt)
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

    const messages = await getManyFrom(ctx.db, 'messages', 'by_chat_id', chat._id, 'chatId')

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
    const openai = createOpenAI({
      apiKey: args.apiKey,
    })

    const response = await generateText({
      model: openai('gpt-5-nano-2025-08-07'),
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

    const existingMessage = await getOneFrom(ctx.db, 'messages', 'by_message_id', message.id, 'id')

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
      activeStreamId: undefined,
    })
  },
})

export const getChatActiveStreamId = query({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) => q.eq('id', args.chatId).eq('userId', args.userId))
      .first()

    if (!chat) {
      throw new ConvexError('Chat not found')
    }

    return chat.activeStreamId
  },
})

export const updateChatActiveStreamId = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    activeStreamId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) => q.eq('id', args.chatId).eq('userId', args.userId))
      .first()

    if (!chat) {
      throw new ConvexError('Chat not found')
    }

    await ctx.db.patch(chat._id, { activeStreamId: args.activeStreamId })
  },
})
