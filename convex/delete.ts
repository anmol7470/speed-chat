import { v } from 'convex/values'
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
        throw new Error(`Message ${messageId} not found`)
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
