'use client'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { SearchResult } from '@/convex/search'
import { useQueryWithStatus } from '@/lib/utils'
import { useConvexAuth } from 'convex/react'
import debounce from 'lodash.debounce'
import { LogIn, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type SearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const debouncedSetQuery = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedQuery(query)
      }, 500),
    []
  )

  useEffect(() => {
    debouncedSetQuery(searchQuery)
    return () => {
      debouncedSetQuery.cancel()
    }
  }, [searchQuery, debouncedSetQuery])

  const { data: searchResults, isPending } = useQueryWithStatus(
    api.search.searchAll,
    debouncedQuery.length > 0 ? { query: debouncedQuery } : 'skip'
  )

  const handleSelectResult = useCallback(
    (result: NonNullable<SearchResult>[number]) => {
      const chatId = result.type === 'chat' ? result.id : result.chatId
      router.push(`/chat/${chatId}`)
      onOpenChange(false)
    },
    [router, onOpenChange]
  )

  const isLoading = isAuthenticated && debouncedQuery.length > 0 && isPending
  const hasResults = searchResults && searchResults.length > 0
  const showEmptyState = isAuthenticated && debouncedQuery.length > 0 && !isLoading && !hasResults
  const isSignedOut = !isAuthenticated

  // Helper function to highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <span className="bg-blue-500 text-white" key={index}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[80vh] max-w-2xl p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Search Chats and Messages</DialogTitle>
        <Command>
          <CommandInput
            className="border-none focus:ring-0"
            disabled={isSignedOut}
            onValueChange={setSearchQuery}
            placeholder={isSignedOut ? 'Sign in to search...' : 'Search your chats and messages'}
            value={searchQuery}
          />
          <CommandList className="max-h-[60vh] overflow-y-auto">
            {isLoading && (
              <div className="space-y-4 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="flex items-center space-x-3" key={i}>
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showEmptyState && (
              <CommandEmpty>
                <p className="text-muted-foreground py-8 text-center">
                  No results found for &ldquo;{debouncedQuery}&rdquo;
                </p>
              </CommandEmpty>
            )}

            {searchResults && searchResults.length > 0 && (
              <CommandGroup>
                {searchResults.map((result) => (
                  <CommandItem
                    className="flex cursor-pointer items-center space-x-3 p-3"
                    key={`${result.type}-${result._id}`}
                    onSelect={() => handleSelectResult(result)}
                    value={`${result.type}-${result.type === 'chat' ? result.title : result.text_part}`}
                  >
                    <div className="shrink-0">
                      <MessageSquare className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {result.type === 'chat'
                          ? highlightText(result.title, debouncedQuery)
                          : highlightText(result.chatTitle, debouncedQuery)}
                      </div>
                      <div className="text-muted-foreground truncate text-sm">
                        {result.type === 'chat'
                          ? highlightText(result.title, debouncedQuery)
                          : highlightText(result.highlightSnippet, debouncedQuery)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {isSignedOut && (
              <div className="text-muted-foreground p-6 text-center">
                <LogIn className="mx-auto mb-4 size-12 opacity-50" />
                <p className="mb-4 text-sm">You need to be signed in to search your chats and messages</p>
              </div>
            )}

            {!isSignedOut && debouncedQuery.length === 0 && (
              <div className="text-muted-foreground p-6 text-center">
                <MessageSquare className="mx-auto mb-4 size-12 opacity-50" />
                <p className="text-sm">Find chats by title or search through message content</p>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
