import type { Chat } from '@/lib/types'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { GitBranch, MoreHorizontal, PinOff, Pin, Pencil, Trash2 } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export function SidebarChatItem({ chat, currentChatId }: { chat: Chat; currentChatId: string }) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [isRenamingChat, setIsRenamingChat] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [newChatTitle, setNewChatTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const isStreaming = false

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
            className="!bg-transparent w-full border-none px-0 shadow-none focus-visible:ring-0"
            onBlur={clearInput}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // renameChatTitle({
                //   chatId: chat.id,
                //   newTitle: newChatTitle,
                // })
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
      {chat.id === currentChatId && isStreaming ? (
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
              onClick={() => {
                // pinChat({
                //   chatId: chat.id,
                //   isPinned: !chat.isPinned,
                // })
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
                // toast.promise(deleteChat({ chatId: chat.id }), {
                //   loading: 'Deleting chat...',
                //   success: 'Chat deleted',
                //   error: 'Failed to delete chat',
                // })
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
