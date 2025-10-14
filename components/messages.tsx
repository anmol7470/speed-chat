import { UIMessageWithMetadata } from '@/lib/types'
import { UseChatHelpers } from '@ai-sdk/react'
import { AssistantMessage } from './assistant-message'
import { UserMessage } from './user-message'

type MessagesProps = {
  messages: UIMessageWithMetadata[]
  status: UseChatHelpers<UIMessageWithMetadata>['status']
}

export function Messages({ messages, status }: MessagesProps) {
  return (
    <div className="mx-auto my-12 flex w-full max-w-[740px] flex-1 flex-col gap-6 text-[14.5px]">
      {messages.map((message) => {
        if (message.role === 'user') {
          return <UserMessage key={message.id} message={message} allMessages={messages} />
        }

        if (message.role === 'assistant') {
          return <AssistantMessage key={message.id} message={message} isAnimating={status === 'streaming'} />
        }
      })}
    </div>
  )
}
