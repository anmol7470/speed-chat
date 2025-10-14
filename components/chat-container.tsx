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
    <div className="relative h-full w-full">
      <Header user={user} />
      {shouldShowCenteredEmptyState ? (
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:px-0">
          <h1 className="text-2xl md:text-3xl">
            {user ? `How can I help you today, ${user.name.split(' ')[0]}?` : 'How can I help you today?'}
          </h1>
          <ChatInput user={user} />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col">
          <StickToBottom resize="smooth" initial="instant" className="relative min-h-0 flex-1 overflow-y-auto">
            <StickToBottom.Content>
              <div className="mx-auto w-full max-w-3xl p-2.5 px-4 md:px-0">
                {isLoadingMessages ? null : <Messages />}
              </div>
            </StickToBottom.Content>
            <ScrollToBottom />
          </StickToBottom>
          <div className="mx-auto w-full max-w-3xl px-4 pb-2.5 md:px-0">
            <ChatInput user={user} />
          </div>
        </div>
      )}
    </div>
  )
}

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    !isAtBottom && (
      <div className="pointer-events-none absolute right-0 bottom-2 left-0">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-0">
          <div className="flex justify-center">
            <Button size="sm" className="pointer-events-auto shadow-sm" onClick={() => scrollToBottom()} type="button">
              <ArrowDown className="mr-1 size-4" />
              Scroll to bottom
            </Button>
          </div>
        </div>
      </div>
    )
  )
}
