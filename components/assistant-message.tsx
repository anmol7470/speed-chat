import { api } from '@/convex/_generated/api'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { UIMessageWithMetadata } from '@/lib/types'
import { getErrorMessage } from '@/lib/error'
import { useMutation } from 'convex/react'
import { Check, Copy, GitBranch, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Streamdown } from 'streamdown'
import { useChatConfig } from './chat-config-provider'
import { useChatContext } from './chat-provider'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type AssistantMessageProps = {
  message: UIMessageWithMetadata
  isAnimating: boolean
}

export function AssistantMessage({ message, isAnimating }: AssistantMessageProps) {
  const router = useRouter()
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const { chatId } = useChatConfig()
  const { regenerate, messages: allMessages, buildBodyAndHeaders } = useChatContext()

  const deleteMessages = useMutation(api.delete.deleteMessages)
  const branchOffFromMessage = useMutation(api.chatActions.branchOffFromMessage)

  const isLastMessage = allMessages[allMessages.length - 1].id === message.id
  const messageContent = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')

  return (
    <div className="group max-w-[95%]">
      <div className="space-y-2 break-words whitespace-pre-wrap">
        {message.parts
          .filter((part) => part.type === 'text')
          .map((part, index) => (
            <Streamdown isAnimating={isAnimating} key={index}>
              {part.text}
            </Streamdown>
          ))}
      </div>
      <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" type="button" onClick={() => copyToClipboard(messageContent)}>
              {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span className="sr-only">Copy message</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isCopied ? 'Copied!' : 'Copy'}</TooltipContent>
        </Tooltip>
        {isLastMessage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={() => {
                  try {
                    deleteMessages({ messageIdsToDelete: [message.id] })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  }
                  const { body, headers } = buildBodyAndHeaders()
                  regenerate({
                    body,
                    headers,
                  })
                }}
              >
                <RefreshCw className="size-4" />
                <span className="sr-only">Regenerate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={() => {
                toast
                  .promise(branchOffFromMessage({ parentChatId: chatId, messageId: message.id }), {
                    loading: 'Branching off from message...',
                    success: 'Message branched off successfully',
                    error: (error) => {
                      return getErrorMessage(error)
                    },
                  })
                  .then((branchChatId) => {
                    router.push(`/chat/${branchChatId}`)
                  })
              }}
            >
              <GitBranch className="size-4" />
              <span className="sr-only">Branch</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Branch</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
