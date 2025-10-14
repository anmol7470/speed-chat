import 'server-only'
import { auth } from '.'
import { headers } from 'next/headers'

export const getSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
}
