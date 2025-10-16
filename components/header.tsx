import { LoginButton } from './app-sidebar'
import { SidebarTrigger } from './ui/sidebar'
import { useUser } from './user-provider'

export function Header() {
  const { user, isPending: isUserPending } = useUser()

  return (
    <header className="absolute top-0 left-0 z-10 flex h-12 w-full items-center justify-between px-2">
      <SidebarTrigger className="bg-transparent backdrop-blur-sm" />
      {!user && !isUserPending && <LoginButton className="flex md:hidden" variant="default" size="sm" />}
    </header>
  )
}
