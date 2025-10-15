import { User } from 'better-auth'
import { LoginButton } from './app-sidebar'
import { SidebarTrigger } from './ui/sidebar'

export function Header({ user }: { user: User | undefined }) {
  return (
    <header className="absolute top-0 left-0 z-10 flex h-12 w-full items-center justify-between px-2">
      <SidebarTrigger className="bg-transparent backdrop-blur-sm" />
      {!user && <LoginButton className="flex md:hidden" variant="default" size="sm" />}
    </header>
  )
}
