import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/convex/_generated/api'
import type { Chat } from '@/convex/chat'
import { useIsMobile } from '@/hooks/use-mobile'
import { getErrorMessage } from '@/lib/error'
import { useMutation } from 'convex/react'
import { GitBranch, Loader2, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useChatConfig } from './providers/chat-config-provider'

export function SidebarChatItem({ chat }: { chat: Chat }) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { chatId: currentChatId } = useChatConfig()
  const [isRenamingChat, setIsRenamingChat] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [newChatTitle, setNewChatTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const deleteChat = useMutation(api.delete.deleteChat)
  const pinChat = useMutation(api.chatActions.pinChat)
  const renameChatTitle = useMutation(api.chatActions.renameChatTitle)

  const clearInput = () => {
    setIsRenamingChat(false)
    setRenamingChatId(null)
    setNewChatTitle('')
  }

  return (
    <SidebarMenuItem key={chat.id}>
      <SidebarMenuButton asChild={!(isRenamingChat && chat.id === renamingChatId)} isActive={currentChatId === chat.id}>
        {isRenamingChat && chat.id === renamingChatId ? (
          <Input
            className="w-full border-none !bg-transparent px-0 shadow-none focus-visible:ring-0"
            onBlur={clearInput}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                if (!newChatTitle.trim()) {
                  toast.error('Chat title cannot be empty')
                  return
                }

                try {
                  await renameChatTitle({
                    chatId: chat.id,
                    newTitle: newChatTitle,
                  })
                } catch (error) {
                  toast.error(getErrorMessage(error))
                }
                clearInput()
              } else if (e.key === 'Escape') {
                clearInput()
              }
            }}
            ref={renameInputRef}
            value={newChatTitle}
          />
        ) : (
          <Link className="flex w-full items-center gap-2" href={`/chat/${chat.id}`}>
            {chat.isBranch && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <GitBranch className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Branched from {chat.parentChatId}</TooltipContent>
              </Tooltip>
            )}
            <span className="truncate">{chat.title}</span>
          </Link>
        )}
      </SidebarMenuButton>
      {chat.activeStreamId ? (
        <SidebarMenuAction className="!top-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="sr-only">Loading</span>
        </SidebarMenuAction>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction className="!top-2 cursor-pointer" showOnHover>
              <MoreHorizontal />
              <span className="sr-only">Chat Actions</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isMobile ? 'end' : 'start'}
            className="w-fit rounded-lg"
            onCloseAutoFocus={(e) => {
              if (isRenamingChat) {
                e.preventDefault()
              }
            }}
            side={isMobile ? 'bottom' : 'right'}
          >
            <DropdownMenuItem
              onClick={async () => {
                {
                  try {
                    await pinChat({
                      chatId: chat.id,
                      isPinned: !chat.isPinned,
                    })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  }
                }
              }}
            >
              {chat.isPinned ? <PinOff /> : <Pin />}
              <span>{chat.isPinned ? 'Unpin' : 'Pin'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsRenamingChat(true)
                setRenamingChatId(chat.id)
                setNewChatTitle(chat.title)
                setTimeout(() => {
                  renameInputRef.current?.focus()
                  renameInputRef.current?.select()
                }, 100)
              }}
            >
              <Pencil />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (chat.id === currentChatId) {
                  router.push('/')
                }
                toast.promise(deleteChat({ chatId: chat.id }), {
                  loading: 'Deleting chat...',
                  success: 'Chat deleted',
                  error: (error) => {
                    return getErrorMessage(error)
                  },
                })
              }}
              variant="destructive"
            >
              <Trash2 />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  )
}
