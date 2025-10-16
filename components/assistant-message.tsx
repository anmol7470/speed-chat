import { api } from '@/convex/_generated/api'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getErrorMessage } from '@/lib/error'
import { formatElapsedTime, groupMessageParts } from '@/lib/format-helpers'
import { models } from '@/lib/models'
import { UIMessageWithMetadata } from '@/lib/types'
import { useMutation } from 'convex/react'
import { Bolt, Bot, Check, Clock, Copy, GitBranch, Info, Loader2, RefreshCw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning'
import { Response } from './ai-elements/response'
import { useChatConfig } from './providers/chat-config-provider'
import { useChatContext } from './providers/chat-provider'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
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
    <div className="group">
      <div className="space-y-2 break-words whitespace-pre-wrap">
        {(() => {
          const grouped = groupMessageParts(message.parts)
          const rendered = grouped.map((item, index) => {
            if (item.kind === 'reasoning') {
              return (
                <Reasoning
                  key={item.groupKey}
                  className="w-full"
                  isStreaming={item.isStreaming}
                  defaultOpen={item.defaultOpen}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{item.text}</ReasoningContent>
                </Reasoning>
              )
            }

            if (item.kind === 'text') {
              return (
                <Response isAnimating={isAnimating} key={index}>
                  {item.part.text}
                </Response>
              )
            }

            if (item.kind === 'web') {
              return (
                <div
                  key={index}
                  className="border-border/50 bg-muted/30 text-muted-foreground my-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  {item.part.state === 'output-available' ? (
                    <>
                      <Search className="size-4 shrink-0 text-blue-500" />
                      <span>
                        Searched for{' '}
                        <span className="text-foreground font-medium">{item.part.output?.action.query}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
                      <span>Searching the web...</span>
                    </>
                  )}
                </div>
              )
            }

            return null
          })

          if (rendered.some(Boolean)) return rendered

          return (
            <div className="text-muted-foreground my-4 flex items-center gap-2 rounded-lg text-sm">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span>Processing...</span>
            </div>
          )
        })()}
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
        {message.metadata && (
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Info className="size-4" />
                    <span className="sr-only">Message info</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-3 text-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="text-muted-foreground size-4" />
                    <span>{models.find((model) => model.id === message.metadata?.modelId)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bolt className="text-muted-foreground size-4" />
                    <span>{message.metadata.completionTokens} tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground size-4" />
                    <span>{formatElapsedTime(message.metadata.elapsedTime)}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Message info</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
