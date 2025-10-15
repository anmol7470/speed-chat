import { AppSidebar } from '@/components/app-sidebar'
import { ChatConfigProvider } from '@/components/chat-config-provider'
import { ConvexClientProvider } from '@/components/convex-client-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getSession } from '@/lib/auth/get-session'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Speed Chat',
  description: 'An AI chatbot like ChatGPT supporting multiple models',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <ChatConfigProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <AppSidebar user={session?.user} />
                <SidebarInset>{children}</SidebarInset>
                <Toaster position="top-center" reverseOrder={false} />
              </ThemeProvider>
            </SidebarProvider>
          </ChatConfigProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
