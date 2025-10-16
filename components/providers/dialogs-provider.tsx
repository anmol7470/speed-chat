'use client'

import { ApiKeyDialog } from '@/components/api-key-dialog'
import { SearchDialog } from '@/components/search-dialog'
import { createContext, useContext, useState } from 'react'

type DialogsContextType = {
  openApiKeyDialog: boolean
  setOpenApiKeyDialog: (open: boolean) => void
  openSearchDialog: boolean
  setOpenSearchDialog: (open: boolean) => void
}

const DialogsContext = createContext<DialogsContextType | undefined>(undefined)

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false)
  const [openSearchDialog, setOpenSearchDialog] = useState(false)

  return (
    <DialogsContext.Provider
      value={{
        openApiKeyDialog,
        setOpenApiKeyDialog,
        openSearchDialog,
        setOpenSearchDialog,
      }}
    >
      {children}
      <ApiKeyDialog open={openApiKeyDialog} onOpenChange={setOpenApiKeyDialog} />
      <SearchDialog open={openSearchDialog} onOpenChange={setOpenSearchDialog} />
    </DialogsContext.Provider>
  )
}

export function useDialogs() {
  const context = useContext(DialogsContext)
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogsProvider')
  }
  return context
}
