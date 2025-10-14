import { headers } from 'next/headers'
import { cache } from 'react'
import 'server-only'
import { auth } from '.'

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
})
