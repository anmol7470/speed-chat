import { UIMessageWithMetadata } from '@/lib/types'
import { Streamdown } from 'streamdown'

type AssistantMessageProps = {
  message: UIMessageWithMetadata
  isAnimating: boolean
}

export function AssistantMessage({ message, isAnimating }: AssistantMessageProps) {
  return (
    <div className="space-y-2 break-words whitespace-pre-wrap">
      {message.parts
        .filter((part) => part.type === 'text')
        .map((part, index) => (
          <Streamdown isAnimating={isAnimating} key={index}>
            {part.text}
          </Streamdown>
        ))}
    </div>
  )
}
