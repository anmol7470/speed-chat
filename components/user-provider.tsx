'use client'

import { api } from '@/convex/_generated/api'
import { useQueryWithStatus } from '@/lib/utils'
import { FunctionReturnType } from 'convex/server'
import { createContext, useContext } from 'react'
import { toast } from 'react-hot-toast'

type UserContextType = {
  user: FunctionReturnType<typeof api.user.getCurrentUser> | undefined
  isPending: boolean
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isPending, isError } = useQueryWithStatus(api.user.getCurrentUser)

  if (isError) {
    toast.error('Failed to get current user')
  }

  return <UserContext.Provider value={{ user, isPending }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
