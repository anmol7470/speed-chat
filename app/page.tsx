import { ChatContainer } from '@/components/chat-container'
import { getSession } from '@/lib/auth/get-session'

export default async function Home() {
  const session = await getSession()

  return <ChatContainer user={session?.user} />
}
