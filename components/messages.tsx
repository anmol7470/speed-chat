import { UIMessageWithMetadata } from '@/lib/types'

export function Messages({ messages }: { messages: UIMessageWithMetadata[] }) {
  return (
    <div className="mx-auto w-full max-w-[750px] flex-1">
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, index) => (part.type === 'text' ? <span key={index}>{part.text}</span> : null))}
        </div>
      ))}
    </div>
  )
}
