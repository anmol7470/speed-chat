import { ChatContainerParent } from '@/components/chat-container'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <ChatContainerParent paramsChatId={id} />
}
