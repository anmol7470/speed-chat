import { UIMessageWithMetadata } from '@/lib/types'
import { UseChatHelpers } from '@ai-sdk/react'
import { Streamdown } from 'streamdown'

type MessagesProps = {
  messages: UseChatHelpers<UIMessageWithMetadata>['messages']
  status: UseChatHelpers<UIMessageWithMetadata>['status']
}

export function Messages({ messages, status }: MessagesProps) {
  return (
    <div className="mx-auto my-8 flex w-full max-w-[740px] flex-1 flex-col gap-6 text-[14.5px]">
      {messages.map((message) => (
        <div
          key={message.id}
          className={
            message.role === 'user'
              ? 'bg-muted ml-auto max-w-[85%] rounded-lg p-2.5 break-words whitespace-pre-wrap'
              : 'space-y-2 break-words whitespace-pre-wrap'
          }
        >
          {message.parts
            .filter((part) => part.type === 'text')
            .map((part, index) => (
              <Streamdown isAnimating={status === 'streaming'} key={index}>
                {part.text}
              </Streamdown>
            ))}
        </div>
      ))}
    </div>
  )
}
