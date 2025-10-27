import { useAttachments } from '@/hooks/use-attachments'
import { FileUIPart } from 'ai'
import { ImageIcon, Loader2, PaperclipIcon, XIcon } from 'lucide-react'
import { memo, useMemo } from 'react'
import { Button } from './ui/button'

type FilePreviewProps = {
  filesToSend: FileUIPart[]
  filesToUpload: File[]
  isUploading: ReturnType<typeof useAttachments>['isUploading']
  removeFile: ReturnType<typeof useAttachments>['removeFile']
}

function FilePreview({ filesToSend, filesToUpload, isUploading, removeFile }: FilePreviewProps) {
  const previews = useMemo(
    () =>
      filesToUpload.map((file) => {
        const isFileUploaded = filesToSend.some((f) => f.filename === file.name)

        return (
          <div
            key={file.name}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-2"
            onClick={() => {
              if (isUploading && !isFileUploaded) {
                return
              }
              window.open(URL.createObjectURL(file), '_blank')
            }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {isUploading && !isFileUploaded ? (
                <Loader2 className="size-4 shrink-0 animate-spin opacity-60" aria-hidden="true" />
              ) : (
                <>
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                  ) : (
                    <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                  )}
                </>
              )}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{file.name}</p>
              </div>
            </div>
            {!(isUploading && !isFileUploaded) && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file)
                }}
                aria-label="Remove file"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )
      }),
    [filesToUpload, isUploading, removeFile, filesToSend]
  )

  return <div className="flex flex-wrap gap-2 px-2 pb-3">{previews}</div>
}

export const MemoizedFilePreview = memo(FilePreview)
