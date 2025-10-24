'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import { api } from '@/convex/_generated/api'
import { useQueryWithStatus } from '@/lib/utils'
import { useAuthActions } from '@convex-dev/auth/react'
import { VariantProps } from 'class-variance-authority'
import { Key, LogIn, LogOut, MessageSquare, PenBox, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { useChatConfig } from './providers/chat-config-provider'
import { useDialogs } from './providers/dialogs-provider'
import { useUser } from './providers/user-provider'
import { SidebarChatItem } from './sidebar-chat-item'
import { Button, buttonVariants } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Kbd, KbdGroup } from './ui/kbd'

export function AppSidebar() {
  const { user, isPending: isUserPending } = useUser()
  const { signOut } = useAuthActions()
  const router = useRouter()
  const { chatId } = useChatConfig()
  const { setOpenSearchDialog, setOpenApiKeyDialog } = useDialogs()

  const {
    data: chats,
    error,
    isSuccess,
    isPending,
    isError,
  } = useQueryWithStatus(api.chat.getAllChats, user ? {} : 'skip')

  useEffect(() => {
    if (isError) {
      toast.error(error.message)
    }
  }, [isError, error])

  const pinnedChats = useMemo(() => {
    return chats?.filter((chat) => chat.isPinned)
  }, [chats])

  const unpinnedChats = useMemo(() => {
    return chats?.filter((chat) => !chat.isPinned)
  }, [chats])

  const currentChat = useMemo(() => {
    return chats?.find((chat) => chat.id === chatId)
  }, [chats, chatId])

  useEffect(() => {
    if (currentChat) {
      document.title = `${currentChat.title} | Speed Chat`
    }
  }, [currentChat])

  return (
    <Sidebar variant="inset" className="px-1">
      <SidebarHeader className="flex flex-col items-center">
        <Link className="flex items-center gap-2" href="/">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-300">
            <MessageSquare className="size-4.5 text-white" />
          </div>
          <span className="text-lg font-medium">SpeedChat</span>
        </Link>
        <SidebarGroup className="px-0 pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/" className="group/button">
                  <PenBox />
                  <div className="flex w-full items-center justify-between gap-2">
                    New chat
                    <KbdGroup className="opacity-0 group-hover/button:opacity-100">
                      <Kbd>⌘</Kbd>
                      <Kbd>⇧</Kbd>
                      <Kbd>O</Kbd>
                    </KbdGroup>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button onClick={() => setOpenSearchDialog(true)} className="group/button">
                  <Search />
                  <div className="flex w-full items-center justify-between gap-2">
                    Search chats
                    <KbdGroup className="opacity-0 group-hover/button:opacity-100">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </KbdGroup>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex flex-1 flex-col">
          {!user && !isUserPending ? (
            <div className="text-muted-foreground mx-auto my-auto flex text-sm">Please login to view your chats.</div>
          ) : isPending || (isSuccess && chats?.length === 0) ? null : (
            <>
              {pinnedChats && pinnedChats.length > 0 && (
                <>
                  <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                  <SidebarMenu>
                    {pinnedChats.map((chat) => (
                      <SidebarChatItem chat={chat} key={chat.id} />
                    ))}
                  </SidebarMenu>
                </>
              )}
              {unpinnedChats && unpinnedChats.length > 0 && (
                <>
                  <SidebarGroupLabel>Chats</SidebarGroupLabel>
                  <SidebarMenu>
                    {unpinnedChats.map((chat) => (
                      <SidebarChatItem chat={chat} key={chat.id} />
                    ))}
                  </SidebarMenu>
                </>
              )}
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isUserPending ? (
          <SidebarMenuSkeleton showIcon={true} />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-2" variant="ghost">
                <Image src={user.image ?? ''} alt={user.name ?? ''} width={30} height={30} className="rounded-full" />
                <span className="truncate text-sm font-normal">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setOpenApiKeyDialog(true)}>
                <Key />
                Configure API Key
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <LoginButton className="flex w-full" variant="outline" size="lg" />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export function LoginButton({
  className,
  variant,
  size,
}: {
  className: string
  variant: VariantProps<typeof buttonVariants>['variant']
  size: VariantProps<typeof buttonVariants>['size']
}) {
  const { signIn } = useAuthActions()

  return (
    <Button className={className} onClick={() => void signIn('google')} size={size} variant={variant}>
      <LogIn className="size-5" />
      Sign in
    </Button>
  )
}
