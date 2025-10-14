import { User } from 'better-auth'
import { ChatInput } from './chat-input'
import { Header } from './header'

export function ChatContainer({ user }: { user: User | undefined }) {
  return (
    <div className="relative h-full w-full">
      <Header user={user} />
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl">
          {user ? `How can I help you today, ${user.name.split(' ')[0]}?` : 'How can I help you today?'}
        </h1>
        <ChatInput user={user} />
      </div>
    </div>
  )
}
