import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Attachment } from '@/types'
import { readFileContent } from '@/lib/api'

interface ChatInputProps {
  onSend: (content: string, attachments?: Attachment[]) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isLoading) return
    onSend(content.trim(), attachments.length > 0 ? attachments : undefined)
    setContent('')
    setAttachments([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      const fileContent = await readFileContent(file)
      newAttachments.push({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        type: file.type,
        size: file.size,
        content: fileContent,
      })
    }

    setAttachments((prev) => [...prev, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background p-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"
            >
              <span className="truncate max-w-[100px]">{a.name}</span>
              <button
                onClick={() => removeAttachment(a.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="min-h-[40px] max-h-[200px] resize-none"
          rows={1}
          disabled={isLoading}
        />

        <Button
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
