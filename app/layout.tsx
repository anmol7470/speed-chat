import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/get-session'
import { Toaster } from 'react-hot-toast'
import { ChatConfigProvider } from '@/components/chat-config-provider'
import { ConvexClientProvider } from '@/components/convex-client-provider'

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen w-screen`}>
        <ConvexClientProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AppSidebar user={session?.user} />
              <SidebarInset>
                <ChatConfigProvider>{children}</ChatConfigProvider>
              </SidebarInset>
              <Toaster position="top-center" reverseOrder={false} />
            </ThemeProvider>
          </SidebarProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
