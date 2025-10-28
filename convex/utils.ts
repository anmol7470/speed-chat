import { customAction, customCtx, customMutation, customQuery } from 'convex-helpers/server/customFunctions'
import { ConvexError } from 'convex/values'
import { action, mutation, query } from './_generated/server'

export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new ConvexError('Not authenticated')
    }
    return { userId: identity.tokenIdentifier }
  })
)

export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new ConvexError('Not authenticated')
    }
    return { userId: identity.tokenIdentifier }
  })
)

export const authedAction = customAction(
  action,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new ConvexError('Not authenticated')
    }
    return { userId: identity.tokenIdentifier }
  })
)
