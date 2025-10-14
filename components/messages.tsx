import { AssistantMessage } from './assistant-message'
import { useChatContext } from './chat-provider'
import { UserMessage } from './user-message'

export function Messages() {
  const { messages, status } = useChatContext()

  return (
    <div className="mx-auto my-12 flex w-full max-w-[740px] flex-1 flex-col gap-6 text-[14.5px]">
      {messages.map((message) => {
        if (message.role === 'user') {
          return <UserMessage key={message.id} message={message} />
        }

        if (message.role === 'assistant') {
          return <AssistantMessage key={message.id} message={message} isAnimating={status === 'streaming'} />
        }
      })}
    </div>
  )
}
