'use client'

import { User } from 'better-auth'
import { ArrowDown } from 'lucide-react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { ChatInput } from './chat-input'
import { ChatProvider, useChatContext } from './chat-provider'
import { Header } from './header'
import { Messages } from './messages'
import { Button } from './ui/button'

export function ChatContainerParent({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  return (
    <ChatProvider user={user} paramsChatId={paramsChatId}>
      <ChatContainer user={user} paramsChatId={paramsChatId} />
    </ChatProvider>
  )
}

function ChatContainer({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  const { messages, isLoadingMessages } = useChatContext()
  const shouldShowCenteredEmptyState = !paramsChatId && messages.length === 0

  return (
    <div className="flex h-full w-full flex-col">
      <Header user={user} />
      {shouldShowCenteredEmptyState ? (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 md:px-0">
          <h1 className="text-2xl md:text-3xl">
            {user ? `How can I help you today, ${user.name.split(' ')[0]}?` : 'How can I help you today?'}
          </h1>
          <ChatInput user={user} />
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden">
            <StickToBottom resize="instant" initial="instant" className="h-full overflow-y-auto">
              <StickToBottom.Content>
                <div className="mx-auto w-full max-w-3xl px-4 md:px-0">{isLoadingMessages ? null : <Messages />}</div>
              </StickToBottom.Content>
              <ScrollToBottom />
            </StickToBottom>
          </div>
          <div className="mb-3 flex-shrink-0 px-4 md:px-0">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput user={user} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    !isAtBottom && (
      <div className="absolute right-0 bottom-2 left-0 flex justify-center">
        <Button size="icon-sm" variant="outline" className="rounded-full" onClick={() => scrollToBottom()}>
          <ArrowDown className="size-4" />
        </Button>
      </div>
    )
  )
}
