import { ChatContainerParent } from '@/components/chat-container'
import { getSession } from '@/lib/auth/get-session'

export default async function Home() {
  const session = await getSession()

  return <ChatContainerParent user={session?.user} paramsChatId="" />
}
