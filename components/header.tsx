import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { LoginButton } from './app-sidebar'
import { useUser } from './providers/user-provider'
import { Button } from './ui/button'
import { SidebarTrigger } from './ui/sidebar'

export function Header() {
  const { user, isPending: isUserPending } = useUser()
  const { theme, setTheme } = useTheme()

  return (
    <header className="absolute top-0 left-0 z-10 flex h-12 w-full items-center justify-between px-2">
      <SidebarTrigger className="bg-transparent backdrop-blur-sm" />
      <div className="flex items-center justify-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        {!user && !isUserPending && <LoginButton className="flex md:hidden" variant="default" size="sm" />}
      </div>
    </header>
  )
}
