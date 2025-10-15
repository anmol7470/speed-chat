import { clsx, type ClassValue } from 'clsx'
import { makeUseQueryWithStatus } from 'convex-helpers/react'
import { useQueries } from 'convex-helpers/react/cache/hooks'
import { ConvexError } from 'convex/values'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries)

export const getConvexError = (error: unknown) => {
  return error instanceof ConvexError
    ? error.data
    : error instanceof Error
      ? error.message
      : 'Unexpected error occurred'
}
