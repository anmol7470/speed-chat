'use client'

import { useChatConfig } from '@/components/chat-config-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Label } from './ui/label'

type ApiKeyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { config, updateConfig } = useChatConfig()
  const [localKey, setLocalKey] = useState(config.apiKey)

  useEffect(() => {
    setLocalKey(config.apiKey)
  }, [config.apiKey])

  const isSaveDisabled = useMemo(
    () => localKey.trim().length === 0 || localKey === config.apiKey,
    [localKey, config.apiKey]
  )

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure API Key</DialogTitle>
          <DialogDescription>Enter your OpenRouter API key.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium" htmlFor="openrouter-key">
              OpenRouter API Key
            </Label>
            <Input
              autoComplete="off"
              id="openrouter-key"
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your API key"
              type="password"
              value={localKey}
            />
            <p className="text-muted-foreground text-xs">
              Get your API key from{' '}
              <a
                className="text-blue-500 hover:underline"
                href="https://openrouter.ai/settings/keys"
                rel="noreferrer"
                target="_blank"
              >
                OpenRouter
              </a>
            </p>
          </div>
        </div>

        <DialogFooter className="flex w-full items-center">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <AlertCircle className="size-4" /> This key is stored locally in your browser.
          </p>
          <Button
            className="ml-auto"
            disabled={isSaveDisabled}
            onClick={() => {
              if (!localKey.startsWith('sk-or-v1-')) {
                toast.error('Please use a valid API key')
                return
              }
              updateConfig({ apiKey: localKey })
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
