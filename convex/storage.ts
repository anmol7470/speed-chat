import { getOneFrom } from 'convex-helpers/server/relationships'
import { ConvexError, v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { authedMutation } from './user'

export const generateUploadUrl = authedMutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const storeFile = authedMutation({
  args: {
    fileId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.fileId)

    if (!url) {
      throw new ConvexError('Failed to get file url')
    }

    await ctx.db.insert('attachments', {
      id: args.fileId,
      url,
      userId: ctx.userId,
    })

    return url
  },
})

export const deleteFiles = authedMutation({
  args: {
    fileUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const storageIds: Id<'_storage'>[] = []

    for (const url of args.fileUrls) {
      const attachment = await getOneFrom(ctx.db, 'attachments', 'by_url', url, 'url')

      if (attachment) {
        storageIds.push(attachment.id)
        await ctx.db.delete(attachment._id)
      }
    }

    for (const id of storageIds) {
      await ctx.storage.delete(id)
    }
  },
})
