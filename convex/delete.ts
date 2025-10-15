import { ConvexError, v } from 'convex/values'
import { UIMessageWithMetadata } from '../lib/types'
import { internal } from './_generated/api'
import { Id } from './_generated/dataModel'
import { internalMutation, mutation } from './_generated/server'

export const deleteMessages = mutation({
  args: {
    messageIdsToDelete: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const convexIdsToDelete: Id<'messages'>[] = []

    for (const messageId of args.messageIdsToDelete) {
      const message = await ctx.db
        .query('messages')
        .withIndex('by_message_id', (q) => q.eq('id', messageId))
        .first()

      if (!message) {
        throw new ConvexError(`Message ${messageId} not found`)
      }

      convexIdsToDelete.push(message._id)

      await ctx.runMutation(internal.delete.deleteAttachmentsFromMessage, {
        messageParts: message.parts,
      })
    }

    for (const convexId of convexIdsToDelete) {
      await ctx.db.delete(convexId)
    }
  },
})

export const deleteAttachmentsFromMessage = internalMutation({
  args: {
    messageParts: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const parts = args.messageParts as UIMessageWithMetadata['parts']
    const attachmentUrls = parts.filter((p) => p.type === 'file' && 'url' in p).flatMap((p) => p.url)

    for (const attachmentUrl of attachmentUrls) {
      const attachment = await ctx.db
        .query('attachments')
        .withIndex('by_url', (q) => q.eq('url', attachmentUrl))
        .first()

      if (attachment) {
        await ctx.db.delete(attachment._id)
        await ctx.storage.delete(attachment.id)
      }
    }
  },
})

export const deleteChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first()

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`)
    }

    // Check if this chat is a parent to any other chats (has branches)
    const childChats = await ctx.db
      .query('chats')
      .withIndex('by_parent_chat_id', (q) => q.eq('parentChatId', args.chatId))
      .first()

    const hasChildBranches = childChats !== null

    await ctx.db.delete(chat._id)

    const messagesToDelete = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
      .collect()

    for (const message of messagesToDelete) {
      // Only delete attachments if this chat has no child branches
      if (!hasChildBranches) {
        await ctx.runMutation(internal.delete.deleteAttachmentsFromMessage, {
          messageParts: message.parts,
        })
      }
      await ctx.db.delete(message._id)
    }
  },
})
