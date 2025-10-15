import { AssistantMessage } from './assistant-message'
import { useChatContext } from './chat-provider'
import { UserMessage } from './user-message'

export function Messages() {
  const { messages, status } = useChatContext()

  return (
    <div className="mx-auto max-w-[740px] space-y-4 pt-16 pb-8 text-[14.5px]">
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
