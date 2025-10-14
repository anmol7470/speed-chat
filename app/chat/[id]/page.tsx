import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  return <div>ChatPage {id}</div>
}
