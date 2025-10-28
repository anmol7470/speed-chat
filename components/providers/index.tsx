import { ThemeProvider } from 'next-themes'
import { cookies } from 'next/headers'
import { SidebarProvider } from '../ui/sidebar'
import { ChatConfigProvider } from './chat-config-provider'
import { ConvexClientProvider } from './convex-client-provider'
import { DialogsProvider } from './dialogs-provider'

export async function Providers({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <ConvexClientProvider>
      <ChatConfigProvider>
        <DialogsProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </SidebarProvider>
        </DialogsProvider>
      </ChatConfigProvider>
    </ConvexClientProvider>
  )
}
