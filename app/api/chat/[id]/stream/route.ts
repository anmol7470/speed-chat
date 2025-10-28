import { api } from '@/convex/_generated/api'
import { getToken } from '@/lib/auth/token'
import { getStreamContext } from '@/lib/stream-context'
import { UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { fetchQuery } from 'convex/nextjs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const streamContext = getStreamContext()

  if (!streamContext) {
    return new Response(null, { status: 204 })
  }

  const activeStreamId = await fetchQuery(
    api.chat.getChatActiveStreamId,
    {
      chatId: id,
    },
    {
      token,
    }
  )

  if (!activeStreamId) {
    return new Response(null, { status: 204 })
  }

  return new Response(await streamContext.resumeExistingStream(activeStreamId), {
    headers: UI_MESSAGE_STREAM_HEADERS,
  })
}
