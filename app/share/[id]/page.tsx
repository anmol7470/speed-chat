import { SharedChatContainer } from '@/components/shared-chat-container'
import { api } from '@/convex/_generated/api'
import { preloadQuery } from 'convex/nextjs'
import { redirect } from 'next/navigation'

export default async function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let preloadedChat

  try {
    preloadedChat = await preloadQuery(api.chat.getSharedChat, { chatId: id })
  } catch {
    redirect('/')
  }

  return <SharedChatContainer preloadedChat={preloadedChat} />
}
