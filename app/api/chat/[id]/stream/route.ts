import { api } from '@/convex/_generated/api'
import { getSession } from '@/lib/auth/get-session'
import { UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { fetchQuery } from 'convex/nextjs'
import { after } from 'next/server'
import { createResumableStreamContext } from 'resumable-stream'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const activeStreamId = await fetchQuery(api.chat.getChatActiveStreamId, {
    chatId: id,
  })

  if (!activeStreamId) {
    // no content response when there is no active stream
    return new Response(null, { status: 204 })
  }

  const streamContext = createResumableStreamContext({
    waitUntil: after,
  })

  return new Response(await streamContext.resumeExistingStream(activeStreamId), {
    headers: UI_MESSAGE_STREAM_HEADERS,
  })
}
