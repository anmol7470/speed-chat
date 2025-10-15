import { User } from 'better-auth'
import { LoginButton } from './app-sidebar'
import { SidebarTrigger } from './ui/sidebar'

export function Header({ user }: { user: User | undefined }) {
  return (
    <header className="pointer-events-none absolute top-0 left-0 z-10 flex h-12 w-full items-center justify-between px-2">
      <div className="pointer-events-auto">
        <SidebarTrigger className="bg-transparent backdrop-blur-sm" />
      </div>
      {!user && <LoginButton className="pointer-events-auto flex md:hidden" variant="default" size="sm" />}
    </header>
  )
}
