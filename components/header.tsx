import { User } from 'better-auth'
import { SidebarTrigger } from './ui/sidebar'
import { LoginButton } from './app-sidebar'

export function Header({ user }: { user: User | undefined }) {
  return (
    <header className="absolute top-0 left-0 z-10 flex h-12 items-center justify-between w-full px-2 pointer-events-none">
      <div className="pointer-events-auto">
        <SidebarTrigger />
      </div>
      {!user && <LoginButton className="flex md:hidden pointer-events-auto" variant="default" size="sm" />}
    </header>
  )
}
