'use client'

import { User } from 'better-auth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { PenBox, Search, MessageSquare, LogOut, LogIn, Moon, Sun } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu'
import { Button, buttonVariants } from './ui/button'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { authClient } from '@/lib/auth/client'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useTheme } from 'next-themes'
import { VariantProps } from 'class-variance-authority'
import { useQueryWithStatus } from '@/lib/utils'
import { api } from '@/convex/_generated/api'
import { useEffect, useMemo } from 'react'
import { SidebarChatItem } from './sidebar-chat-item'

export function AppSidebar({ user }: { user: User | undefined }) {
  const pathname = usePathname()
  const currentChatId = pathname.split('/chat/')[1]
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const {
    data: chats,
    error,
    isSuccess,
    isPending,
    isError,
  } = useQueryWithStatus(api.chat.getAllChats, user?.id ? { userId: user.id } : 'skip')

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

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col items-center">
        <Link className="flex items-center gap-2" href="/">
          <div className="size-8 bg-blue-300 rounded-lg flex items-center justify-center">
            <MessageSquare className="size-4.5 text-white" />
          </div>
          <span className="font-medium text-lg">SpeedChat</span>
        </Link>
        <SidebarGroup className="px-0 pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <PenBox />
                  New chat
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Search />
                Search chats
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        {!user ? (
          <div className="mx-auto my-auto flex text-muted-foreground text-sm">Please login to view your chats.</div>
        ) : isPending || (isSuccess && chats?.length === 0) ? null : (
          <>
            {pinnedChats && pinnedChats.length > 0 && (
              <>
                <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                <SidebarMenu>
                  {pinnedChats.map((chat) => (
                    <SidebarChatItem chat={chat} currentChatId={currentChatId} key={chat.id} />
                  ))}
                </SidebarMenu>
              </>
            )}
            {unpinnedChats && unpinnedChats.length > 0 && (
              <>
                <SidebarGroupLabel>Chats</SidebarGroupLabel>
                <SidebarMenu>
                  {unpinnedChats.map((chat) => (
                    <SidebarChatItem chat={chat} currentChatId={currentChatId} key={chat.id} />
                  ))}
                </SidebarMenu>
              </>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2" variant="ghost">
                <Avatar>
                  <AvatarImage src={user.image ?? ''} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-normal text-sm">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.refresh()
                      },
                      onError: ({ error }) => {
                        toast.error(error.message)
                      },
                    },
                  })
                }
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <Sun className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <Moon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
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
  return (
    <Button
      className={className}
      onClick={() => authClient.signIn.social({ provider: 'google' })}
      size={size}
      variant={variant}
    >
      <LogIn className="size-5" />
      Login
    </Button>
  )
}
