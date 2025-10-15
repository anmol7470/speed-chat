import { getManyFrom, getOneFrom } from 'convex-helpers/server/relationships'
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
      const message = await getOneFrom(ctx.db, 'messages', 'by_message_id', messageId, 'id')

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
      const attachment = await getOneFrom(ctx.db, 'attachments', 'by_url', attachmentUrl, 'url')

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
    const chat = await getOneFrom(ctx.db, 'chats', 'by_chat_id', args.chatId, 'id')

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`)
    }

    // Check if this chat is a parent to any other chats (has branches)
    const childChats = await getOneFrom(ctx.db, 'chats', 'by_parent_chat_id', args.chatId, 'parentChatId')

    const hasChildBranches = childChats !== null

    await ctx.db.delete(chat._id)

    const messagesToDelete = await getManyFrom(ctx.db, 'messages', 'by_chat_id', chat._id, 'chatId')

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
