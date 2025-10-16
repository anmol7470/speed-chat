'use client'

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { User } from 'better-auth'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import { ChatInput } from './chat-input'
import { ChatProvider, useChatContext } from './chat-provider'
import { Header } from './header'
import { Messages } from './messages'

export function ChatContainerParent({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  return (
    <ChatProvider user={user} paramsChatId={paramsChatId}>
      <ChatContainer user={user} paramsChatId={paramsChatId} />
    </ChatProvider>
  )
}

function ChatContainer({ user, paramsChatId }: { user: User | undefined; paramsChatId: string }) {
  const { messages, isLoadingMessages } = useChatContext()
  const noActiveChat = !paramsChatId && messages.length === 0
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (!user) {
        toast.error('Please sign in to attach files')
        return
      }
      setDroppedFiles((prev) => [...prev, ...acceptedFiles])
    },
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
    },
    noClick: true,
    noKeyboard: true,
    onDropRejected: () => {
      toast.error('Only image and PDF files are allowed')
    },
  })

  return (
    <div {...getRootProps()} className="relative flex h-full flex-col">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="border-border bg-primary/10 absolute inset-0 z-50 flex items-center justify-center border border-dashed backdrop-blur-sm">
          <p className="text-primary text-xl font-medium">Drop files here. Only image and PDF files are allowed.</p>
        </div>
      )}
      <Header user={user} />
      {noActiveChat ? (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 md:px-0">
          <h1 className="text-2xl md:text-3xl">
            {user ? `How can I help you today, ${user.name.split(' ')[0]}?` : 'How can I help you today?'}
          </h1>
          <ChatInput
            user={user}
            isDragActive={isDragActive}
            droppedFiles={droppedFiles}
            setDroppedFiles={setDroppedFiles}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="overflow-hidden">
            <ConversationContent className="mx-auto w-full max-w-3xl px-4 md:px-0">
              {isLoadingMessages ? null : <Messages />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="flex-shrink-0 px-2 pb-2">
            <ChatInput
              user={user}
              isDragActive={isDragActive}
              droppedFiles={droppedFiles}
              setDroppedFiles={setDroppedFiles}
            />
          </div>
        </div>
      )}
    </div>
  )
}
